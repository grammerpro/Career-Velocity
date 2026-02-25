// ============================================================================
// CareerVelocity — Applications Kanban Page (Server Component)
// Fetches user applications and renders the Kanban board.
// ============================================================================

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ApplicationKanban from "@/components/kanban/application-kanban";

export const metadata = {
    title: "Application Board | CareerVelocity",
    description: "Track and manage your job applications with a drag-and-drop Kanban board.",
};

async function getApplications(userId: string) {
    const applications = await prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            companyName: true,
            jobTitle: true,
            status: true,
            applicationDate: true,
            jobUrl: true,
            createdAt: true,
            tailoredDocument: {
                select: { id: true },
            },
        },
    });

    return applications.map((a) => ({
        id: a.id,
        companyName: a.companyName,
        jobTitle: a.jobTitle,
        status: a.status,
        applicationDate: a.applicationDate?.toISOString() ?? null,
        jobUrl: a.jobUrl,
        createdAt: a.createdAt.toISOString(),
        hasTailoredDoc: a.tailoredDocument !== null,
    }));
}

export default async function ApplicationsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    const applications = await getApplications(session.user.id);

    return (
        <div className="max-w-full mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    Application Board
                </h1>
                <p className="text-sm text-text-muted mt-1">
                    Drag applications between columns to update their status.
                    {applications.length > 0 && (
                        <span className="ml-2 text-text-secondary">
                            {applications.length} application{applications.length !== 1 ? "s" : ""} tracked
                        </span>
                    )}
                </p>
            </div>

            {/* Kanban Board */}
            <ApplicationKanban
                initialApplications={applications}
                userId={session.user.id}
            />
        </div>
    );
}
