// ============================================================================
// CareerVelocity — Resume & AI Matcher Type Definitions
// Shared types for BaseResume JSON fields and AI-generated output.
// ============================================================================

// ── Base Resume JSON Structures ─────────────────────────────────────────────

export interface Education {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string | null;
    gpa?: string;
    honors?: string;
    description?: string;
}

export interface WorkExperience {
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate: string | null;
    current: boolean;
    bullets: string[];
}

export interface Project {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    bullets: string[];
}

export interface BaseResumeData {
    education: Education[];
    workHistory: WorkExperience[];
    skills: string[];
    projects: Project[];
    summary: string | null;
}

// ── Tailored Resume Output (AI-Generated) ───────────────────────────────────

export interface TailoredWorkExperience {
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate: string | null;
    current: boolean;
    /** Rewritten bullets using target JD nomenclature */
    bullets: string[];
}

export interface TailoredProject {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    /** Rewritten bullets using target JD nomenclature */
    bullets: string[];
}

export interface TailoredResumeOutput {
    /** Rewritten professional summary targeting the specific role */
    summary: string;
    /** Reordered and rephrased work experience */
    workHistory: TailoredWorkExperience[];
    /** Reordered and rephrased projects */
    projects: TailoredProject[];
    /** Skills reordered by relevance to JD, no fabricated skills */
    skills: string[];
    /** Education kept as-is (never modified) */
    education: Education[];
}

// ── ATS Analysis Metadata ───────────────────────────────────────────────────

export interface KeywordMatch {
    keyword: string;
    found: boolean;
    /** Where the keyword was matched: "skills" | "work" | "projects" | "summary" */
    location?: string;
}

export interface ATSAnalysis {
    /** 0-100 score estimating ATS pass-through likelihood */
    score: number;
    /** Keywords extracted from JD and their match status */
    keywordMatches: KeywordMatch[];
    /** Actionable improvement suggestions */
    suggestions: string[];
}

// ── Complete AI Matcher Response ─────────────────────────────────────────────

export interface AIMatcherResult {
    tailoredResume: TailoredResumeOutput;
    coverLetter: string;
    atsAnalysis: ATSAnalysis;
    /** AI model used for generation */
    modelUsed: string;
    /** Total tokens consumed */
    tokensUsed: number;
}

// ── Server Action Return Types ──────────────────────────────────────────────

export type AIMatcherResponse =
    | { success: true; data: AIMatcherResult }
    | { success: false; error: string; code: AIMatcherErrorCode };

export type AIMatcherErrorCode =
    | "QUOTA_EXCEEDED"
    | "USER_NOT_FOUND"
    | "RESUME_NOT_FOUND"
    | "RESUME_NOT_OWNED"
    | "OPENAI_RATE_LIMIT"
    | "OPENAI_TIMEOUT"
    | "OPENAI_API_ERROR"
    | "INVALID_AI_RESPONSE"
    | "INTERNAL_ERROR";
