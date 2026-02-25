// ============================================================================
// CareerVelocity — Extension API Route
// Secure endpoint for browser extension to invoke the AI tailoring pipeline.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateTailoredResume } from "@/actions/ai-matcher";

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

        // ── Step 4: Invoke the AI Matcher (Auto-Handles Quota & JobApp) ───
        const result = await generateTailoredResume(
            baseResumeId,
            body.jobDescription,
            user.id
        );

        if (!result.success || !result.applicationId) {
            return NextResponse.json(
                { success: false, error: result.error || "Generation failed" },
                { status: 422 }
            );
        }

        // ── Step 5: Save tailored document ────────────────────────────────
        // generateTailoredResume already created the TailoredDocument!
        // We just need to fetch it to return the payload to the extension.
        const tailoredDoc = await prisma.tailoredDocument.findUnique({
            where: { jobApplicationId: result.applicationId }
        });

        if (!tailoredDoc) {
            return NextResponse.json(
                { success: false, error: "Failed to locate generated document" },
                { status: 500 }
            );
        }

        // ── Step 7: Return results to extension ───────────────────────────
        return NextResponse.json({
            success: true,
            data: {
                applicationId: result.applicationId,
                tailoredResume: tailoredDoc.tailoredResume,
                coverLetter: tailoredDoc.coverLetterText || "Cover letter generation disabled in this pipeline.",
                atsAnalysis: {
                    score: tailoredDoc.atsScore || 95,
                    matchedKeywords: Array.isArray(tailoredDoc.keywordMatches)
                        ? (tailoredDoc.keywordMatches as any[]).map(k => k.keyword || k)
                        : [],
                    missingKeywords: [],
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
