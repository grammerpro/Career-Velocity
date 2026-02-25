"use client";

// ============================================================================
// CareerVelocity — Document Retrieval Modal
// Fetches and displays the exact TailoredDocument + Cover Letter
// used for a specific application. Solves the "which resume did I send?" pain.
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    X,
    FileText,
    Mail,
    Target,
    Loader2,
    AlertCircle,
    Sparkles,
    Copy,
    Check,
    ExternalLink,
} from "lucide-react";
import { retrieveTailoredDocument, type TailoredDocData } from "@/actions/applications";

// ── Types ───────────────────────────────────────────────────────────────────

interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string;
    userId: string;
    companyName: string;
    jobTitle: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DocumentModal({
    isOpen,
    onClose,
    applicationId,
    userId,
    companyName,
    jobTitle,
}: DocumentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [doc, setDoc] = useState<TailoredDocData | null>(null);
    const [activeTab, setActiveTab] = useState<"resume" | "cover-letter" | "ats">("resume");
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // ── Fetch document on open ──────────────────────────────────────────────
    const fetchDocument = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await retrieveTailoredDocument(userId, applicationId);
        if (result.success && result.data) {
            setDoc(result.data);
        } else {
            setError(result.error ?? "Failed to retrieve document.");
        }
        setLoading(false);
    }, [userId, applicationId]);

    useEffect(() => {
        if (isOpen) {
            fetchDocument();
        } else {
            // Reset state when closing
            setDoc(null);
            setError(null);
            setActiveTab("resume");
        }
    }, [isOpen, fetchDocument]);

    // ── Copy to clipboard ──────────────────────────────────────────────────
    const copyToClipboard = async (text: string, fieldName: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // ── Tabs config ───────────────────────────────────────────────────────
    const tabs = [
        { id: "resume" as const, label: "Tailored Resume", icon: FileText },
        { id: "cover-letter" as const, label: "Cover Letter", icon: Mail },
        { id: "ats" as const, label: "ATS Score", icon: Target },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
                            "md:w-[800px] md:max-h-[85vh] z-50",
                            "glass rounded-2xl border border-white/10 flex flex-col overflow-hidden",
                            "shadow-2xl shadow-brand-500/10"
                        )}
                    >
                        {/* ── Header ────────────────────────────────────────────────── */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-text-primary truncate">
                                    {companyName}
                                </h2>
                                <p className="text-sm text-text-muted truncate">{jobTitle}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={`/dashboard/applications/${applicationId}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-brand-500/20"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    View & Export PDF
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Tab Bar ───────────────────────────────────────────────── */}
                        <div className="flex gap-1 px-6 pt-4 pb-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                        activeTab === tab.id
                                            ? "text-white"
                                            : "text-text-muted hover:text-text-secondary hover:bg-white/5"
                                    )}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="doc-tab-active"
                                            className="absolute inset-0 rounded-xl bg-brand-500/20 border border-brand-500/30"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <tab.icon className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── Content ───────────────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                                    <p className="text-sm text-text-muted">Retrieving documents…</p>
                                </div>
                            )}

                            {error && (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <AlertCircle className="w-8 h-8 text-accent-rose" />
                                    <p className="text-sm text-accent-rose text-center">{error}</p>
                                </div>
                            )}

                            {doc && !loading && (
                                <AnimatePresence mode="wait">
                                    {/* ── Resume Tab ──────────────────────────────────────── */}
                                    {activeTab === "resume" && (
                                        <motion.div
                                            key="resume"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-4"
                                        >
                                            <ResumeSection
                                                data={doc.tailoredResume}
                                                onCopy={copyToClipboard}
                                                copiedField={copiedField}
                                            />
                                        </motion.div>
                                    )}

                                    {/* ── Cover Letter Tab ────────────────────────────────── */}
                                    {activeTab === "cover-letter" && (
                                        <motion.div
                                            key="cover-letter"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {doc.coverLetterText ? (
                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            copyToClipboard(doc.coverLetterText!, "cover-letter")
                                                        }
                                                        className={cn(
                                                            "absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg z-10",
                                                            "text-xs font-medium transition-all",
                                                            copiedField === "cover-letter"
                                                                ? "bg-accent-emerald/20 text-accent-emerald"
                                                                : "bg-surface-600 text-text-muted hover:text-text-primary"
                                                        )}
                                                    >
                                                        {copiedField === "cover-letter" ? (
                                                            <><Check className="w-3.5 h-3.5" /> Copied</>
                                                        ) : (
                                                            <><Copy className="w-3.5 h-3.5" /> Copy</>
                                                        )}
                                                    </button>
                                                    <div className="bg-surface-700 rounded-xl p-5 border border-white/5">
                                                        <pre className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed font-sans">
                                                            {doc.coverLetterText}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ) : (
                                                <EmptyState message="No cover letter was generated for this application." />
                                            )}
                                        </motion.div>
                                    )}

                                    {/* ── ATS Score Tab ───────────────────────────────────── */}
                                    {activeTab === "ats" && (
                                        <motion.div
                                            key="ats"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-5"
                                        >
                                            {doc.atsScore !== null ? (
                                                <>
                                                    {/* Score Ring */}
                                                    <div className="flex items-center gap-6 p-5 bg-surface-700 rounded-xl border border-white/5">
                                                        <div className="relative w-20 h-20 flex-shrink-0">
                                                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                                <circle
                                                                    cx="18" cy="18" r="15.9"
                                                                    fill="none"
                                                                    stroke="rgba(255,255,255,0.05)"
                                                                    strokeWidth="3"
                                                                />
                                                                <motion.circle
                                                                    cx="18" cy="18" r="15.9"
                                                                    fill="none"
                                                                    stroke={
                                                                        doc.atsScore >= 80 ? "#34d399" :
                                                                            doc.atsScore >= 60 ? "#fbbf24" : "#fb7185"
                                                                    }
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray="100"
                                                                    initial={{ strokeDashoffset: 100 }}
                                                                    animate={{ strokeDashoffset: 100 - doc.atsScore }}
                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                />
                                                            </svg>
                                                            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-text-primary">
                                                                {doc.atsScore}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">
                                                                ATS Compatibility Score
                                                            </p>
                                                            <p className="text-xs text-text-muted mt-1">
                                                                {doc.atsScore >= 80
                                                                    ? "Excellent match — high likelihood of passing ATS filters."
                                                                    : doc.atsScore >= 60
                                                                        ? "Good match — consider addressing missing keywords."
                                                                        : "Needs improvement — several critical keywords are missing."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Keyword Matches */}
                                                    {doc.keywordMatches && doc.keywordMatches.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-text-primary mb-3">
                                                                Keyword Matches
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {doc.keywordMatches.map((kw, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={cn(
                                                                            "px-3 py-1 rounded-full text-xs font-medium",
                                                                            (kw as { found?: boolean }).found
                                                                                ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                                                                                : "bg-accent-rose/10 text-accent-rose border border-accent-rose/20"
                                                                        )}
                                                                    >
                                                                        {(kw as { keyword?: string }).keyword ?? "—"}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Suggestions */}
                                                    {doc.suggestions && doc.suggestions.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-text-primary mb-3">
                                                                Improvement Suggestions
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {doc.suggestions.map((s, i) => (
                                                                    <li
                                                                        key={i}
                                                                        className="flex gap-2 text-sm text-text-secondary"
                                                                    >
                                                                        <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                                                                        <span>{s}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <EmptyState message="No ATS analysis available for this application." />
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* ── Footer ────────────────────────────────────────────────── */}
                        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-text-muted">
                            <span>
                                {doc?.modelUsed && `Generated by ${doc.modelUsed}`}
                            </span>
                            <span>
                                {doc?.generatedAt &&
                                    `Created ${new Date(doc.generatedAt).toLocaleDateString()}`}
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ── Resume Section Renderer ─────────────────────────────────────────────────

function ResumeSection({
    data,
    onCopy,
    copiedField,
}: {
    data: Record<string, unknown>;
    onCopy: (text: string, field: string) => void;
    copiedField: string | null;
}) {
    const resume = data as {
        summary?: string;
        workHistory?: Array<{
            company: string;
            role: string;
            date: string;
            description: string;
        }>;
        skills?: string[];
        projects?: Array<{
            name: string;
            description: string;
        }>;
        education?: Array<{
            school: string;
            degree: string;
            date: string;
        }>;
    };

    return (
        <div className="space-y-5">
            {/* Summary */}
            {resume.summary && (
                <div className="relative bg-surface-700 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Professional Summary
                        </h4>
                        <button
                            onClick={() => onCopy(resume.summary!, "summary")}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all",
                                copiedField === "summary"
                                    ? "text-accent-emerald"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            {copiedField === "summary" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        {resume.summary}
                    </p>
                </div>
            )}

            {/* Work History */}
            {resume.workHistory && resume.workHistory.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                        Work Experience
                    </h4>
                    <div className="space-y-3">
                        {resume.workHistory.map((job, i) => (
                            <div
                                key={i}
                                className="bg-surface-700 rounded-xl p-4 border border-white/5"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-text-primary">
                                        {job.role}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        {job.date}
                                    </span>
                                </div>
                                <span className="text-xs text-brand-300">{job.company}</span>
                                {job.description && (
                                    <ul className="mt-2 space-y-1">
                                        {job.description.split('\n').filter(p => p.trim() !== '').map((b, j) => (
                                            <li
                                                key={j}
                                                className="text-sm text-text-secondary pl-3 relative before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-brand-500"
                                            >
                                                {b.trim().replace(/^[-•]\s*/, '')}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {resume.skills && resume.skills.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                        Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {resume.education && resume.education.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                        Education
                    </h4>
                    {resume.education.map((edu, i) => (
                        <div key={i} className="bg-surface-700 rounded-xl p-4 border border-white/5">
                            <span className="text-sm font-semibold text-text-primary">
                                {edu.degree}
                            </span>
                            <div className="flex justify-between items-center mt-0.5">
                                <p className="text-xs text-brand-300">{edu.school}</p>
                                <p className="text-xs text-text-muted">{edu.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 text-text-muted opacity-40" />
            <p className="text-sm text-text-muted text-center">{message}</p>
        </div>
    );
}
