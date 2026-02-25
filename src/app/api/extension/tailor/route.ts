// ============================================================================
// CareerVelocity — Extension API Route
// Secure endpoint for browser extension to invoke the AI tailoring pipeline.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { tailorResumeToJob } from "@/actions/ai-matcher";

// ── Types ───────────────────────────────────────────────────────────────────

interface ExtensionTailorRequest {
    userId: string;
    jobDescription: string;
    companyName: string;
    jobTitle: string;
    sourceUrl: string;
}

// ============================================================================
// POST — Tailor a resume via the extension
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        // ── Step 1: Authenticate via Bearer token ─────────────────────────
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { success: false, error: "Missing or invalid authorization header" },
                { status: 401 }
            );
        }

        const token = authHeader.slice(7);

        // Validate the JWT/session token against the database
        // In production, this should verify a JWT signature.
        // For now, we look up the user by a stored extension token.
        const user = await prisma.user.findFirst({
            where: {
                id: token, // Simplified: token = userId for development
            },
            select: {
                id: true,
                aiQuotaUsed: true,
                aiQuotaLimit: true,
                baseResumes: {
                    orderBy: { updatedAt: "desc" },
                    take: 1,
                    select: { id: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Invalid authentication token" },
                { status: 401 }
            );
        }

        // ── Step 2: Parse request body ────────────────────────────────────
        const body = (await request.json()) as ExtensionTailorRequest;

        if (!body.jobDescription || body.jobDescription.length < 50) {
            return NextResponse.json(
                { success: false, error: "Job description is too short (minimum 50 characters)" },
                { status: 400 }
            );
        }

        // ── Step 3: Find the user's default base resume ───────────────────
        const baseResumeId = user.baseResumes[0]?.id;
        if (!baseResumeId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No base resume found. Please upload a resume on CareerVelocity first.",
                },
                { status: 400 }
            );
        }

        // ── Step 4: Create a job application record ───────────────────────
        const application = await prisma.jobApplication.create({
            data: {
                userId: user.id,
                companyName: body.companyName || "Unknown Company",
                jobTitle: body.jobTitle || "Unknown Position",
                jobUrl: body.sourceUrl || null,
                rawDescription: body.jobDescription,
                status: "TAILORING",
            },
        });

        // ── Step 5: Invoke the AI Matcher ─────────────────────────────────
        const result = await tailorResumeToJob(
            user.id,
            baseResumeId,
            body.jobDescription
        );

        if (!result.success) {
            // Update application status on failure
            await prisma.jobApplication.update({
                where: { id: application.id },
                data: { status: "SAVED" },
            });

            return NextResponse.json(
                { success: false, error: result.error },
                { status: 422 }
            );
        }

        // ── Step 6: Save tailored document ────────────────────────────────
        await prisma.tailoredDocument.create({
            data: {
                jobApplicationId: application.id,
                tailoredResume: JSON.parse(JSON.stringify(result.data.tailoredResume)),
                coverLetterText: result.data.coverLetter,
                atsScore: result.data.atsAnalysis.score,
                keywordMatches: JSON.parse(JSON.stringify(result.data.atsAnalysis.keywordMatches)),
                suggestions: result.data.atsAnalysis.suggestions,
                modelUsed: "gpt-4o",
            },
        });

        // Mark application as tailored
        await prisma.jobApplication.update({
            where: { id: application.id },
            data: { status: "TAILORING" },
        });

        // ── Step 7: Return results to extension ───────────────────────────
        return NextResponse.json({
            success: true,
            data: {
                applicationId: application.id,
                tailoredResume: result.data.tailoredResume,
                coverLetter: result.data.coverLetter,
                atsAnalysis: {
                    score: result.data.atsAnalysis.score,
                    matchedKeywords: result.data.atsAnalysis.keywordMatches
                        .filter((k) => k.found)
                        .map((k) => k.keyword),
                    missingKeywords: result.data.atsAnalysis.keywordMatches
                        .filter((k) => !k.found)
                        .map((k) => k.keyword),
                },
            },
        });
    } catch (error) {
        console.error("[Extension API] Tailor request failed:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
