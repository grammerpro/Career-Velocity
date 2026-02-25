// ============================================================================
// CareerVelocity — Extension Resumes API Route
// Returns the user's base resumes for the extension resume picker.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const token = authHeader.slice(7);

    const user = await prisma.user.findFirst({
        where: { id: token },
        select: {
            baseResumes: {
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json(
            { success: false, error: "Invalid token" },
            { status: 401 }
        );
    }

    return NextResponse.json({
        success: true,
        resumes: user.baseResumes.map((r) => ({
            id: r.id,
            title: r.title,
            updatedAt: r.updatedAt.toISOString(),
        })),
    });
}
