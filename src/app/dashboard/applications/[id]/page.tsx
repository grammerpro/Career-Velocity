import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Calendar, CheckCircle2, FileText, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import ResumePreview from "@/components/dashboard/resume-preview";
import PrintResumeButton from "@/components/dashboard/print-resume-button";

export const metadata = {
    title: "Tailored Application | CareerVelocity",
};

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/sign-in");

    const resolvedParams = await params;

    // Fetch the Application and its attached 1:1 Tailored Resume
    const application = await prisma.jobApplication.findUnique({
        where: {
            id: resolvedParams.id,
            userId: session.user.id,
        },
        include: {
            tailoredDocument: true,
        },
    });

    if (!application || !application.tailoredDocument) {
        notFound();
    }

    const { tailoredDocument } = application;
    const resumeData = tailoredDocument.tailoredResume;

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Top Navigation */}
            <div className="flex items-center justify-between print:hidden">
                <Link
                    href="/dashboard/applications"
                    className="group flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Application Board
                </Link>

                {/* PDF Download Button (Placeholder for Phase 11 PDF Export) */}
                {/* PDF Download Button triggers native print */}
                <PrintResumeButton />
            </div>

            {/* Application Overview Header */}
            <div className="bg-background-light border border-border-dim rounded-2xl p-6 sm:p-8 relative overflow-hidden print:hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FileText className="w-48 h-48" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400 font-medium text-sm bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                        <Sparkles className="w-4 h-4" />
                        AI Optmized Output
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold font-display text-white mb-2">
                        {application.jobTitle}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-text-secondary text-sm">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-brand-400" />
                            {application.companyName}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-brand-400" />
                            {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                        {application.status === 'SAVED' && (
                            <div className="flex items-center gap-1.5 text-brand-300">
                                <CheckCircle2 className="w-4 h-4" />
                                Ready to Send
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Split Layout: Job Description vs Tailored Resume */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Sidebar: Original Job Description */}
                <div className="lg:col-span-1 bg-background-light border border-border-dim rounded-2xl p-6 print:hidden">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-400" />
                        Target Job Description
                    </h2>
                    <div className="prose prose-sm prose-invert max-w-none text-text-secondary bg-background/50 p-4 rounded-xl max-h-[800px] overflow-y-auto whitespace-pre-wrap">
                        {application.rawDescription}
                    </div>
                </div>

                {/* Right Area: The Rendered Resume Document */}
                <div className="lg:col-span-2 relative print:col-span-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent rounded-3xl pointer-events-none print:hidden" />

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-2 sm:p-4 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto ring-1 ring-white/10 print:p-0 print:border-none print:shadow-none print:ring-0">

                        {/* THE RENDER ENGINE */}
                        <ResumePreview data={resumeData} />

                    </div>
                </div>

            </div>

        </div>
    );
}
