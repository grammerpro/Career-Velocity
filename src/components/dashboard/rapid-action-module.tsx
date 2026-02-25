"use client";

// ============================================================================
// CareerVelocity — Rapid Action Module
// One-click JD paste → AI tailoring trigger. The power move on the dashboard.
// ============================================================================

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Wand2,
    ClipboardPaste,
    Building2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface BaseResume {
    id: string;
    title: string;
}

interface RapidActionModuleProps {
    baseResumes: BaseResume[];
    onTailor: (data: {
        jobDescription: string;
        companyName: string;
        jobTitle: string;
        baseResumeId: string;
    }) => Promise<{ success: boolean; error?: string }>;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RapidActionModule({
    baseResumes,
    onTailor,
}: RapidActionModuleProps) {
    const [jobDescription, setJobDescription] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [selectedResumeId, setSelectedResumeId] = useState(
        baseResumes[0]?.id ?? ""
    );
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const canSubmit =
        jobDescription.trim().length > 50 &&
        companyName.trim().length > 0 &&
        jobTitle.trim().length > 0 &&
        selectedResumeId;

    // ── Handle paste from clipboard ─────────────────────────────────────────
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setJobDescription(text);
            }
        } catch {
            // Clipboard API may fail — fallback to manual paste
        }
    };

    // ── Handle submit ───────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!canSubmit || isPending) return;

        setResult(null);
        startTransition(async () => {
            const response = await onTailor({
                jobDescription: jobDescription.trim(),
                companyName: companyName.trim(),
                jobTitle: jobTitle.trim(),
                baseResumeId: selectedResumeId,
            });

            setResult(
                response.success
                    ? { type: "success", message: "Resume tailored successfully! View it in your applications." }
                    : { type: "error", message: response.error ?? "Something went wrong. Please try again." }
            );
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass rounded-2xl p-6"
        >
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Quick Tailor</h2>
                    <p className="text-xs text-text-muted">
                        Paste a job description and generate a tailored resume instantly
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* ── Company + Job Title Row ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Company name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={cn(
                                "w-full pl-10 pr-4 py-3 rounded-xl text-sm",
                                "bg-surface-700 border border-white/5 text-text-primary",
                                "placeholder:text-text-muted",
                                "focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25",
                                "transition-all duration-200 outline-none"
                            )}
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Job title (e.g. Senior Frontend Engineer)"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl text-sm",
                            "bg-surface-700 border border-white/5 text-text-primary",
                            "placeholder:text-text-muted",
                            "focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25",
                            "transition-all duration-200 outline-none"
                        )}
                    />
                </div>

                {/* ── Job Description Textarea ────────────────────────────────────── */}
                <div className="relative">
                    <textarea
                        placeholder="Paste the full job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={5}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl text-sm leading-relaxed resize-none",
                            "bg-surface-700 border border-white/5 text-text-primary",
                            "placeholder:text-text-muted",
                            "focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25",
                            "transition-all duration-200 outline-none"
                        )}
                    />
                    <button
                        onClick={handlePaste}
                        className={cn(
                            "absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                            "text-xs font-medium text-text-muted",
                            "bg-surface-600 hover:bg-surface-500 hover:text-text-primary",
                            "transition-all duration-200"
                        )}
                    >
                        <ClipboardPaste className="w-3.5 h-3.5" />
                        Paste
                    </button>
                </div>

                {/* ── Resume Selector + Submit ────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    {/* Resume Dropdown */}
                    <div className="relative flex-1 max-w-xs">
                        <select
                            value={selectedResumeId}
                            onChange={(e) => setSelectedResumeId(e.target.value)}
                            className={cn(
                                "w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm",
                                "bg-surface-700 border border-white/5 text-text-primary",
                                "focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25",
                                "transition-all duration-200 outline-none"
                            )}
                        >
                            {baseResumes.length === 0 && (
                                <option value="">No resumes uploaded</option>
                            )}
                            {baseResumes.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>

                    {/* Tailor Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isPending}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold",
                            "transition-all duration-200 shadow-lg",
                            canSubmit && !isPending
                                ? "gradient-brand text-white shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98]"
                                : "bg-surface-600 text-text-muted cursor-not-allowed"
                        )}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Tailoring...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4" />
                                Tailor Resume
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Result Toast ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm",
                            result.type === "success"
                                ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                                : "bg-accent-rose/10 text-accent-rose border border-accent-rose/20"
                        )}
                    >
                        {result.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span>{result.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
