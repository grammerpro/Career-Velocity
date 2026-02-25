"use server";

// ============================================================================
// CareerVelocity — Application Server Actions
// Status updates (Kanban drag) and document retrieval.
// ============================================================================

import prisma from "@/lib/prisma";

// ── Types ───────────────────────────────────────────────────────────────────

export type ApplicationStatus = "SAVED" | "TAILORING" | "APPLIED" | "INTERVIEW" | "REJECTED" | "OFFER";

export interface UpdateStatusResult {
    success: boolean;
    error?: string;
}

export interface TailoredDocData {
    tailoredResume: Record<string, unknown>;
    coverLetterText: string | null;
    atsScore: number | null;
    keywordMatches: Record<string, unknown>[] | null;
    suggestions: string[] | null;
    generatedAt: string;
    modelUsed: string | null;
}

export interface RetrieveDocResult {
    success: boolean;
    data?: TailoredDocData;
    error?: string;
}

// ── Update Application Status (Kanban drag) ─────────────────────────────────

const VALID_STATUSES: ApplicationStatus[] = [
    "SAVED",
    "TAILORING",
    "APPLIED",
    "INTERVIEW",
    "REJECTED",
    "OFFER",
];

export async function updateApplicationStatus(
    userId: string,
    applicationId: string,
    newStatus: ApplicationStatus
): Promise<UpdateStatusResult> {
    try {
        if (!VALID_STATUSES.includes(newStatus)) {
            return { success: false, error: "Invalid application status." };
        }

        // Verify ownership before updating
        const application = await prisma.jobApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true },
        });

        if (!application) {
            return { success: false, error: "Application not found." };
        }

        if (application.userId !== userId) {
            return { success: false, error: "Unauthorized access." };
        }

        // Update status + set application date when moving to APPLIED
        await prisma.jobApplication.update({
            where: { id: applicationId },
            data: {
                status: newStatus,
                ...(newStatus === "APPLIED" && { applicationDate: new Date() }),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("[Applications] Status update failed:", error);
        return { success: false, error: "Failed to update application status." };
    }
}

// ── Retrieve Tailored Documents for an Application ──────────────────────────

export async function retrieveTailoredDocument(
    userId: string,
    applicationId: string
): Promise<RetrieveDocResult> {
    try {
        // Fetch with ownership check via nested where
        const application = await prisma.jobApplication.findFirst({
            where: { id: applicationId, userId },
            select: {
                tailoredDocument: {
                    select: {
                        tailoredResume: true,
                        coverLetterText: true,
                        atsScore: true,
                        keywordMatches: true,
                        suggestions: true,
                        generatedAt: true,
                        modelUsed: true,
                    },
                },
            },
        });

        if (!application) {
            return { success: false, error: "Application not found or unauthorized." };
        }

        if (!application.tailoredDocument) {
            return {
                success: false,
                error: "No tailored document exists for this application. Use the AI Matcher to generate one.",
            };
        }

        const doc = application.tailoredDocument;

        return {
            success: true,
            data: {
                tailoredResume: doc.tailoredResume as Record<string, unknown>,
                coverLetterText: doc.coverLetterText,
                atsScore: doc.atsScore,
                keywordMatches: doc.keywordMatches as Record<string, unknown>[] | null,
                suggestions: doc.suggestions as string[] | null,
                generatedAt: doc.generatedAt.toISOString(),
                modelUsed: doc.modelUsed,
            },
        };
    } catch (error) {
        console.error("[Applications] Document retrieval failed:", error);
        return { success: false, error: "Failed to retrieve tailored document." };
    }
}
