import { Suspense } from "react";
import { getBaseResumes } from "@/actions/resumes";
import { ResumesClient } from "./client";

export const metadata = {
    title: "Base Resumes | CareerVelocity",
    description: "Manage your master base resumes for AI tailoring.",
};

export default async function ResumesPage() {
    // Fetch resumes on the server
    const initialResumes = await getBaseResumes();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <Suspense fallback={<ResumesLoadingSkeleton />}>
                <ResumesClient initialResumes={initialResumes} />
            </Suspense>
        </div>
    );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

function ResumesLoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-pulse">
                <div>
                    <div className="h-8 w-48 bg-surface-700/50 rounded-lg mb-2"></div>
                    <div className="h-4 w-72 bg-surface-800/50 rounded-lg"></div>
                </div>
                <div className="h-10 w-36 bg-surface-700/50 rounded-xl"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-surface-700/50 mb-4"></div>
                            <div className="h-5 w-3/4 bg-surface-700/50 rounded mb-2"></div>
                            <div className="h-3 w-full bg-surface-800/50 rounded"></div>
                            <div className="h-3 w-2/3 bg-surface-800/50 rounded mt-1"></div>
                        </div>
                        <div className="h-3 w-1/4 bg-surface-800/50 rounded mt-4"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
