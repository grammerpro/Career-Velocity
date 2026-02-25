"use server";

// ============================================================================
// CareerVelocity — PDF Compilation Server Action
// Orchestrates: Generate PDF buffer → Upload to S3 → Persist URL in DB.
// ============================================================================

import prisma from "@/lib/prisma";
import { generateResumePDF } from "@/lib/pdf-generator";
import { uploadToS3, deleteFromS3 } from "@/lib/storage";
import type { TailoredResumeOutput } from "@/types/resume";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CompilePDFResult {
    success: boolean;
    s3Url?: string;
    error?: string;
}

// ============================================================================
// compileTailoredPDF — Main Orchestrator
// ============================================================================

/**
 * Compile a tailored resume JSON into an ATS-optimized PDF, upload to S3,
 * and save the download URL to the TailoredDocument record.
 *
 * Flow:
 * 1. Fetch the TailoredDocument + User (for candidate name)
 * 2. Generate the ATS-safe PDF buffer
 * 3. Upload to S3 under the user's folder
 * 4. Update the TailoredDocument with the S3 key + URL
 * 5. Return the secure URL
 */
export async function compileTailoredPDF(
    userId: string,
    jobApplicationId: string
): Promise<CompilePDFResult> {
    try {
        // ── Step 1: Fetch data ────────────────────────────────────────────
        const application = await prisma.jobApplication.findFirst({
            where: { id: jobApplicationId, userId },
            select: {
                companyName: true,
                jobTitle: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                tailoredDocument: {
                    select: {
                        id: true,
                        tailoredResume: true,
                        s3PdfKey: true,
                    },
                },
            },
        });

        if (!application) {
            return {
                success: false,
                error: "Application not found or unauthorized.",
            };
        }

        if (!application.tailoredDocument) {
            return {
                success: false,
                error: "No tailored document found. Run the AI Matcher first.",
            };
        }

        const tailoredResume =
            application.tailoredDocument.tailoredResume as unknown as TailoredResumeOutput;

        if (!tailoredResume || !tailoredResume.workHistory) {
            return {
                success: false,
                error: "Tailored resume data is malformed. Please regenerate.",
            };
        }

        // ── Step 2: Generate PDF Buffer ───────────────────────────────────
        const candidateName =
            application.user.name ?? application.user.email ?? "Candidate";

        let pdfBuffer: Buffer;
        try {
            pdfBuffer = await generateResumePDF({
                resume: tailoredResume,
                candidateName,
                candidateEmail: application.user.email ?? undefined,
            });
        } catch (pdfError) {
            console.error("[PDF Compiler] PDF generation failed:", pdfError);
            return {
                success: false,
                error: "Failed to generate PDF. Please try again.",
            };
        }

        // ── Step 3: Upload to S3 ─────────────────────────────────────────
        // Clean up previous PDF if it exists (prevents orphaned files)
        if (application.tailoredDocument.s3PdfKey) {
            try {
                await deleteFromS3(application.tailoredDocument.s3PdfKey);
            } catch {
                // Non-critical — log and continue
                console.warn("[PDF Compiler] Failed to delete old PDF, continuing...");
            }
        }

        // Generate a safe filename
        const safeCompany = application.companyName
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();
        const safeTitle = application.jobTitle
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();
        const filename = `${safeCompany}-${safeTitle}-resume.pdf`;

        let uploadResult;
        try {
            uploadResult = await uploadToS3(pdfBuffer, {
                userId,
                folder: "tailored-pdfs",
                filename,
                contentType: "application/pdf",
            });
        } catch (uploadError) {
            console.error("[PDF Compiler] S3 upload failed:", uploadError);
            return {
                success: false,
                error: "Failed to upload PDF to storage. Please try again.",
            };
        }

        // ── Step 4: Persist S3 references in database ────────────────────
        await prisma.tailoredDocument.update({
            where: { id: application.tailoredDocument.id },
            data: {
                s3PdfUrl: uploadResult.s3Url,
                s3PdfKey: uploadResult.s3Key,
            },
        });

        // ── Step 5: Return URL ───────────────────────────────────────────
        return {
            success: true,
            s3Url: uploadResult.s3Url,
        };
    } catch (error) {
        console.error("[PDF Compiler] Unhandled error:", error);
        return {
            success: false,
            error: "An unexpected error occurred during PDF compilation.",
        };
    }
}
