"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateTailoredResume } from "@/actions/ai-matcher";
import { Wand2, FileText, AlertCircle, Bot, Zap, Loader2 } from "lucide-react";

interface MatcherClientProps {
    baseResumes: { id: string; title: string }[];
    quotaUsed: number;
    quotaLimit: number;
}

export default function MatcherClient({ baseResumes, quotaUsed, quotaLimit }: MatcherClientProps) {
    const router = useRouter();
    const [selectedResumeId, setSelectedResumeId] = useState<string>(
        baseResumes.length > 0 ? baseResumes[0].id : ""
    );
    const [jobDescription, setJobDescription] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedResumeId) {
            setError("Please select a Base Resume.");
            return;
        }

        if (!jobDescription.trim()) {
            setError("Please paste a Job Description.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await generateTailoredResume(selectedResumeId, jobDescription);
            if (!res.success) {
                setError(res.error || "Failed to generate resume.");
                setIsLoading(false);
                return;
            }

            // Redirect to the newly created application
            if (res.applicationId) {
                router.push(`/dashboard/applications/${res.applicationId}`);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const hasQuota = quotaUsed < quotaLimit;

    if (baseResumes.length === 0) {
        return (
            <div className="bg-background-light p-10 rounded-2xl border border-border-dim text-center mt-6">
                <FileText className="w-12 h-12 text-brand-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Base Resumes Found</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                    You need to create or upload at least one Base Resume before using the AI Matcher.
                </p>
                <button
                    onClick={() => router.push("/dashboard/resumes")}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                    Create a Base Resume
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleGenerate} className="bg-background-light rounded-2xl border border-border-dim p-6 shadow-sm">
                    {/* Select Resume */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                1. Select Base Resume
                            </label>
                            <p className="text-sm text-text-secondary mb-3">
                                Choose which master resume you want to tailor for this specific role.
                            </p>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedResumeId}
                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                className="w-full bg-background border border-border-dim rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                            >
                                {baseResumes.map((resume) => (
                                    <option key={resume.id} value={resume.id}>
                                        {resume.title}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Paste JD */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                2. Paste Target Job Description
                            </label>
                            <p className="text-sm text-text-secondary mb-3">
                                Paste the full job description. The AI will extract requirements, keywords, and map your experience to them.
                            </p>
                        </div>

                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="e.g. We are looking for a Senior Frontend Developer with 5+ years of React experience..."
                            className="w-full bg-background border border-border-dim rounded-xl px-4 py-3 text-white h-64 focus:outline-none focus:border-brand-500 transition-colors placeholder:text-text-muted resize-none md:resize-y"
                            required
                        />
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !hasQuota}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${!hasQuota
                            ? "bg-background border border-border-dim text-text-muted cursor-not-allowed"
                            : isLoading
                                ? "bg-brand-500/80 text-white cursor-wait"
                                : "bg-brand-500 hover:bg-brand-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Tailoring your Resume... (Takes ~10s)
                            </>
                        ) : !hasQuota ? (
                            <>Out of AI Quotas</>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate Tailored Resume
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Sidebar Stats Area */}
            <div className="space-y-6">
                {/* Quota Card */}
                <div className="bg-background-light rounded-2xl border border-border-dim p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">AI Quota</h3>
                            <p className="text-xs text-text-secondary">Generations remaining</p>
                        </div>
                    </div>

                    <div className="mb-2 flex justify-between text-sm">
                        <span className="text-text-secondary">Used</span>
                        <span className="text-white font-medium">{quotaUsed} / {quotaLimit}</span>
                    </div>

                    <div className="w-full bg-background rounded-full h-2 mb-4 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all ${quotaUsed >= quotaLimit ? "bg-red-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min((quotaUsed / quotaLimit) * 100, 100)}%` }}
                        ></div>
                    </div>

                    {!hasQuota && (
                        <button className="w-full py-2 bg-white text-brand-600 text-sm font-bold rounded-lg hover:bg-white/90 transition-colors">
                            Upgrade Plan
                        </button>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-background-light rounded-2xl border border-border-dim p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-brand-400" />
                        </div>
                        <h3 className="font-semibold text-white">How it works</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-text-secondary">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-400 mt-1">•</span>
                            <span>We extract the core requirements and keywords from the Job Description.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-400 mt-1">•</span>
                            <span>Your Base Resume experiences are computationally mapped and rewritten to highlight relevance.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-400 mt-1">•</span>
                            <span>A custom summary and ATS-friendly skillset list are generated.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-400 mt-1">•</span>
                            <span>Output strictly aligns with our database schema for pristine rendering.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div >
    );
}
