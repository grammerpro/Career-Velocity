"use client";

import { useState, useRef } from "react";
import { FileText, Plus, X, Loader2, Trash2, UploadCloud, Code, File } from "lucide-react";
import { createBaseResume, deleteBaseResume } from "@/actions/resumes";
import { uploadAndParseResume } from "@/actions/resume-parser";

interface BaseResume {
    id: string;
    title: string;
    summary: string | null;
    updatedAt: Date;
}

export function ResumesClient({ initialResumes }: { initialResumes: BaseResume[] }) {
    const [resumes, setResumes] = useState(initialResumes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");

    // Manual Form state
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [workHistory, setWorkHistory] = useState("[]");
    const [education, setEducation] = useState("[]");
    const [skills, setSkills] = useState("[]");
    const [projects, setProjects] = useState("[]");

    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [error, setError] = useState<string | null>(null);

    const closeModal = () => {
        setIsModalOpen(false);
        setTitle(""); setSummary(""); setWorkHistory("[]"); setEducation("[]"); setSkills("[]"); setProjects("[]");
        setFile(null);
        setError(null);
    };

    const handleManualSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            JSON.parse(workHistory);
            JSON.parse(education);
            JSON.parse(skills);
            JSON.parse(projects);

            const result = await createBaseResume({
                title, summary, workHistory, education, skills, projects,
            });

            if (result.success && result.data) {
                setResumes([result.data as BaseResume, ...resumes]);
                closeModal();
            } else {
                setError(result.error || "Failed to create resume.");
            }
        } catch (err) {
            setError("Invalid JSON format. Please check your data fields.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadSubmit = async () => {
        if (!file) {
            setError("Please select a PDF file first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setLoadingMessage("Extracting text from PDF...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Change loading message after a short delay to simulate AI processing
            setTimeout(() => {
                setLoadingMessage("AI is structuring your resume data...");
            }, 1500);

            const result = await uploadAndParseResume(formData);

            if (result.success && result.data) {
                setResumes([result.data as BaseResume, ...resumes]);
                closeModal();
            } else {
                setError(result.error || "Failed to parse the PDF. Ensure it contains selectable text.");
            }
        } catch (err) {
            setError("An unexpected error occurred during upload.");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === "manual") {
            await handleManualSubmit();
        } else {
            await handleUploadSubmit();
        }
    }

    const handleDelete = async (id: string) => {
        setIsLoading(true);
        const res = await deleteBaseResume(id);
        if (res.success) {
            setResumes(resumes.filter(r => r.id !== id));
        }
        setIsLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Base Resumes</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Manage your master resumes. The AI Matcher uses these as the foundation.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-brand-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Base Resume
                </button>
            </div>

            {/* List of Resumes */}
            {resumes.length === 0 ? (
                <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-surface-700 bg-surface-800/50">
                    <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 text-brand-400">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">No resumes found</h3>
                    <p className="text-sm text-text-muted mt-2 max-w-sm">
                        You haven't added any base resumes yet. Create your first master resume by uploading a PDF.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-6 px-6 py-2.5 rounded-xl bg-surface-700 text-white font-medium hover:bg-surface-600 transition-colors text-sm"
                    >
                        Upload Resume
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="glass rounded-2xl p-6 hover:border-surface-600 transition-colors flex flex-col group">
                            <div className="flex items-start justify-between">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <button
                                    onClick={() => handleDelete(resume.id)}
                                    disabled={isLoading}
                                    className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Resume"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="font-semibold text-text-primary mb-1 truncate">{resume.title}</h3>
                            <p className="text-xs text-text-muted line-clamp-2 mb-4">
                                {resume.summary || "No summary provided."}
                            </p>
                            <div className="mt-auto flex items-center justify-between text-xs text-text-muted">
                                <span>Updated: {new Date(resume.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Upload Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-surface-900 border border-surface-700 shadow-2xl">

                        <div className="p-6 border-b border-surface-700 flex items-center justify-between bg-surface-800/50">
                            <h2 className="text-xl font-bold text-text-primary">Add Base Resume</h2>
                            <button
                                onClick={closeModal}
                                disabled={isLoading}
                                className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Tabs */}
                            <div className="flex items-center gap-2 mb-6 p-1 bg-surface-800 rounded-xl border border-surface-700">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("upload")}
                                    disabled={isLoading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "upload" ? "bg-surface-700 text-white shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
                                >
                                    <UploadCloud className="w-4 h-4" /> Auto-Parse PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("manual")}
                                    disabled={isLoading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "manual" ? "bg-surface-700 text-white shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
                                >
                                    <Code className="w-4 h-4" /> JSON Entry
                                </button>
                            </div>

                            <form id="resume-form" onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {activeTab === "upload" ? (
                                    <div className="space-y-4">
                                        <div
                                            className="w-full h-48 border-2 border-dashed border-surface-600 rounded-2xl bg-surface-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={(e) => {
                                                    const selected = e.target.files?.[0];
                                                    if (selected && selected.type === "application/pdf") {
                                                        setFile(selected);
                                                        setError(null);
                                                    } else if (selected) {
                                                        setError("Please select a valid PDF file.");
                                                    }
                                                }}
                                            />
                                            {file ? (
                                                <div className="text-center">
                                                    <File className="w-10 h-10 text-brand-400 mx-auto mb-3" />
                                                    <p className="text-sm font-medium text-text-primary">{file.name}</p>
                                                    <p className="text-xs text-text-muted mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <div className="text-center px-4">
                                                    <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-4 text-text-secondary">
                                                        <UploadCloud className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-medium text-text-primary mb-1">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-text-muted">PDF files only (Max 5MB)</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
                                            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px]">AI</span>
                                                How it works
                                            </h4>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                We will use GPT-4o to extract and structure your PDF into a clean data model automatically. This ensures the AI Matcher engine works perfectly when generating new variations.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Resume Title</label>
                                                <input
                                                    required
                                                    value={title}
                                                    onChange={e => setTitle(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    placeholder="e.g., Software Engineer Master"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Summary (Optional)</label>
                                                <textarea
                                                    value={summary}
                                                    onChange={e => setSummary(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y"
                                                    placeholder="Brief professional summary..."
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-surface-800 border border-surface-700">
                                            <p className="text-xs text-text-secondary mb-4 flex items-center gap-2 font-medium">
                                                <Code className="w-4 h-4" />
                                                Manual Array Injection
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Work History (JSON)</label>
                                                    <textarea
                                                        value={workHistory}
                                                        onChange={e => setWorkHistory(e.target.value)}
                                                        rows={4}
                                                        className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-sm text-brand-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Education (JSON)</label>
                                                    <textarea
                                                        value={education}
                                                        onChange={e => setEducation(e.target.value)}
                                                        rows={4}
                                                        className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-sm text-brand-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Skills (JSON)</label>
                                                    <textarea
                                                        value={skills}
                                                        onChange={e => setSkills(e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-sm text-brand-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Projects (JSON)</label>
                                                    <textarea
                                                        value={projects}
                                                        onChange={e => setProjects(e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-sm text-brand-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 border-t border-surface-700 bg-surface-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-text-muted flex items-center gap-2">
                                {isLoading && <><Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" /> {loadingMessage}</>}
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isLoading}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="resume-form"
                                    disabled={isLoading || (activeTab === "upload" && !file)}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : activeTab === "upload" ? "Upload & Parse" : "Save Resume"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
