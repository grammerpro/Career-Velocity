import { redirect } from "next/navigation";
import Link from "next/link";
import { Brain, ArrowRight, Building2, Briefcase } from "lucide-react";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";

export const metadata = {
    title: "Interview Prep - CareerVelocity",
};

export default async function InterviewPrepPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const applications = await prisma.jobApplication.findMany({
        where: {
            userId: session.user.id,
            tailoredDocument: { isNot: null }, // Only show apps that have a tailored doc
        },
        orderBy: { updatedAt: "desc" },
        include: { tailoredDocument: true },
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-surface-900 border-l border-white/5">
            <div className="glass px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-[0_0_15px_rgba(var(--brand-500),0.15)]">
                        <Brain className="w-6 h-6 text-brand-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                            Interview Prep
                        </h1>
                        <p className="text-text-muted mt-1">
                            Practice custom mock interviews based on your tailored resumes
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {applications.length === 0 ? (
                        <div className="text-center py-24 glass rounded-3xl border border-white/5">
                            <Brain className="w-12 h-12 text-brand-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-text-primary mb-2">
                                No Applications Ready for Interview
                            </h3>
                            <p className="text-text-secondary max-w-sm mx-auto mb-6">
                                Run the AI Matcher to generate tailored documents for a job application before you can start practicing.
                            </p>
                            <Link
                                href="/dashboard/matcher"
                                className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/20"
                            >
                                Go to AI Matcher
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {applications.map((app) => (
                                <Link
                                    key={app.id}
                                    href={`/dashboard/interview-prep/${app.id}`}
                                    className="group glass p-6 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center text-brand-300 font-bold text-lg mb-2">
                                                {app.companyName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                                Ready
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-1 group-hover:text-brand-300 transition-colors">
                                            {app.jobTitle}
                                        </h3>

                                        <div className="space-y-2 mt-4 text-sm text-text-muted">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                <span className="truncate">{app.companyName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                <span>Applied on {formatShortDate(app.applicationDate || app.createdAt)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between group-hover:border-brand-500/20 transition-colors">
                                            <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                                Start Session
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all transform group-hover:-rotate-45">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
