import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InterviewSession from "@/components/interview/interview-session";
import type { InterviewPrepData } from "@/actions/interview-prep";

export const metadata = {
    title: "Interview Session - CareerVelocity",
};

export default async function InterviewSessionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const application = await prisma.jobApplication.findUnique({
        where: {
            id: id,
            userId: session.user.id,
        },
        include: {
            tailoredDocument: true,
        },
    });

    if (!application || !application.tailoredDocument) {
        notFound();
    }

    const doc = application.tailoredDocument;
    const existingPrep = (doc as any).interviewPrep as InterviewPrepData | null;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-surface-900 border-l border-white/5">
            <div className="glass px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-[0_0_15px_rgba(var(--brand-500),0.15)]">
                        <Sparkles className="w-6 h-6 text-brand-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                            Mock Interview: {application.companyName}
                        </h1>
                        <p className="text-text-muted mt-1">
                            Target Role: {application.jobTitle}
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard/interview-prep"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors border border-white/5"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to List
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto h-full">
                    <InterviewSession
                        applicationId={application.id}
                        companyName={application.companyName}
                        jobTitle={application.jobTitle}
                        initialPrepData={existingPrep}
                    />
                </div>
            </div>
        </div>
    );
}
