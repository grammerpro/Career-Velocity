"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    Sparkles,
    Loader2,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Lightbulb,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateInterviewPrep, type InterviewPrepData, type InterviewQuestion } from "@/actions/interview-prep";

interface InterviewSessionProps {
    applicationId: string;
    companyName: string;
    jobTitle: string;
    initialPrepData: InterviewPrepData | null;
}

export default function InterviewSession({
    applicationId,
    companyName,
    jobTitle,
    initialPrepData
}: InterviewSessionProps) {
    const [prepData, setPrepData] = useState<InterviewPrepData | null>(initialPrepData);
    const [isGenerating, setIsGenerating] = useState(false);

    // Interactive state for questions
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHints, setShowHints] = useState(false);
    const [completed, setCompleted] = useState<Record<number, boolean>>({});

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await generateInterviewPrep(applicationId);
            if (res.success && res.data) {
                setPrepData(res.data);
            } else {
                alert(res.error || "Failed to generate interview questions");
            }
        } catch (err) {
            console.error(err);
            alert("A critical error occurred while generating questions.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!prepData) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-6 border border-brand-500/20 shadow-xl shadow-brand-500/10">
                    <Brain className="w-10 h-10 text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">AI Interview Generator</h2>
                <p className="text-text-secondary leading-relaxed mb-8">
                    We will analyze the exact job description for <strong className="text-brand-300">{jobTitle}</strong> at <strong className="text-brand-300">{companyName}</strong> alongside your tailored resume to create 5 highly specific mock questions.
                </p>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing Resume & JD...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate Custom Interview
                        </>
                    )}
                </button>
            </div>
        );
    }

    const { questions } = prepData;
    const currentQ = questions[currentIndex];

    const isCompleted = Object.keys(completed).length === questions.length;

    return (
        <div className="flex flex-col h-full space-y-6">

            {/* ── Progress Header ────────────────────────────────────────── */}
            <div className="glass p-5 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex gap-2">
                    {questions.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "h-2 w-12 rounded-full transition-all duration-300",
                                idx === currentIndex
                                    ? "bg-brand-500 shadow-[0_0_12px_rgba(var(--brand-500),0.6)]"
                                    : completed[idx]
                                        ? "bg-brand-500/30"
                                        : "bg-surface-700"
                            )}
                        />
                    ))}
                </div>
                <div className="text-sm font-medium text-text-muted">
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            {/* ── Question Card ─────────────────────────────────────────── */}
            <div className="relative flex-1 bg-surface-800 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="p-8 md:p-12 w-full h-full"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <span className={cn(
                                "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border",
                                currentQ.type === "behavioral"
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                                {currentQ.type}
                            </span>
                            {completed[currentIndex] && (
                                <span className="flex items-center gap-1.5 text-xs text-brand-400">
                                    <CheckCircle2 className="w-4 h-4" /> Marked Complete
                                </span>
                            )}
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight mb-8">
                            "{currentQ.question}"
                        </h3>

                        <div className="space-y-6 mt-12">
                            {/* Rationale Toggle Context */}
                            <div className="glass rounded-2xl p-6 border border-white/5 bg-surface-700/30">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
                                    <Target className="w-4 h-4 text-brand-400" />
                                    Why are they asking this?
                                </h4>
                                <p className="text-text-secondary leading-relaxed">
                                    {currentQ.rationale}
                                </p>
                            </div>

                            {/* Hints / Tips Area */}
                            <div>
                                <button
                                    onClick={() => setShowHints(!showHints)}
                                    className="flex items-center gap-2 text-brand-300 text-sm font-medium hover:text-brand-400 transition-colors mb-4"
                                >
                                    <Lightbulb className={cn("w-4 h-4", showHints && "text-amber-400")} />
                                    {showHints ? "Hide Interview Tips" : "Show Interview Tips"}
                                </button>

                                <AnimatePresence>
                                    {showHints && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <ul className="space-y-3 pb-6">
                                                {currentQ.tips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-3 bg-brand-500/5 border border-brand-500/10 p-4 rounded-xl">
                                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                                                        <span className="text-sm text-text-secondary leading-relaxed">{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Action Controls ────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={() => {
                        setCurrentIndex(Math.max(0, currentIndex - 1));
                        setShowHints(false);
                    }}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-text-secondary hover:text-white hover:bg-surface-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                    <ChevronLeft className="w-5 h-5" /> Previous
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setCompleted(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
                        }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                            completed[currentIndex]
                                ? "bg-surface-800 text-text-secondary border border-white/5"
                                : "bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 border border-brand-500/20"
                        )}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        {completed[currentIndex] ? "Mark Unread" : "Mark as Practiced"}
                    </button>

                    <button
                        onClick={() => {
                            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));
                            setShowHints(false);
                        }}
                        disabled={currentIndex === questions.length - 1}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-lg shadow-brand-500/20"
                    >
                        Next <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Completion Modal/Overlay could go here */}
            {isCompleted && currentIndex === questions.length - 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between"
                >
                    <div>
                        <h4 className="text-emerald-400 font-bold mb-1">Excellent Work!</h4>
                        <p className="text-sm text-text-secondary">You've successfully practiced all generated interview questions for this role.</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
