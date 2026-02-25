import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MatcherClient from "./client";

export const metadata = {
    title: "AI Job Matcher | CareerVelocity",
};

export default async function MatcherPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // Fetch Base Resumes for the dropdown
    const baseResumes = await prisma.baseResume.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true }
    });

    // Check user Quotas
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { aiQuotaUsed: true, aiQuotaLimit: true }
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-display text-white">AI Job Matcher</h1>
                <p className="text-text-secondary mt-1">
                    Select a Base Resume and paste a Target Job Description. Our AI will perfectly tailor your experience.
                </p>
            </div>

            <MatcherClient
                baseResumes={baseResumes}
                quotaUsed={user?.aiQuotaUsed || 0}
                quotaLimit={user?.aiQuotaLimit || 5}
            />
        </div>
    );
}
