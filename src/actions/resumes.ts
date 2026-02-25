"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Fetch all Base Resumes for the current user.
 */
export async function getBaseResumes() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    return prisma.baseResume.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
    });
}

/**
 * Create a new Base Resume from JSON input.
 */
export async function createBaseResume(data: {
    title: string;
    summary?: string;
    education?: string;
    workHistory?: string;
    skills?: string;
    projects?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const resume = await prisma.baseResume.create({
            data: {
                userId: session.user.id,
                title: data.title,
                summary: data.summary,
                education: data.education ? JSON.parse(data.education) : [],
                workHistory: data.workHistory ? JSON.parse(data.workHistory) : [],
                skills: data.skills ? JSON.parse(data.skills) : [],
                projects: data.projects ? JSON.parse(data.projects) : [],
            },
        });

        revalidatePath("/dashboard/resumes");
        return { success: true, data: resume };
    } catch (error) {
        console.error("[CREATE_RESUME_ERROR]", error);
        return { success: false, error: "Failed to create resume. Ensure JSON format is valid." };
    }
}

/**
 * Delete a Base Resume by ID.
 */
export async function deleteBaseResume(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.baseResume.delete({
            where: {
                id,
                userId: session.user.id, // Security check
            },
        });

        revalidatePath("/dashboard/resumes");
        return { success: true };
    } catch (error) {
        console.error("[DELETE_RESUME_ERROR]", error);
        return { success: false, error: "Failed to delete resume." };
    }
}
