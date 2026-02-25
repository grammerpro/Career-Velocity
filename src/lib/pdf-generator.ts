// ============================================================================
// CareerVelocity — ATS-Safe PDF Generator
// Converts tailored resume JSON → single-column, ATS-compliant PDF buffer.
//
// Design constraints:
//   • Single-column layout (no tables, no columns, no graphics)
//   • Helvetica only (universally safe for ATS parsing)
//   • Explicit section headers ("Professional Experience", "Technical Skills")
//   • Standard reading order (top-to-bottom) for Workday/Greenhouse parsers
// ============================================================================

import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    renderToBuffer,
} from "@react-pdf/renderer";
import type {
    TailoredResumeOutput,
    Education,
    TailoredWorkExperience,
    TailoredProject,
} from "@/types/resume";

// ── Suppress default hyphenation (breaks ATS keyword matching) ──────────────

Font.registerHyphenationCallback((word) => [word]);

// ── Style System ────────────────────────────────────────────────────────────

const COLORS = {
    primary: "#111827",          // Near-black for body text
    secondary: "#374151",        // Dark gray for subtitles
    muted: "#6B7280",            // Gray for dates and metadata
    accent: "#1D4ED8",           // Blue for name header
    divider: "#D1D5DB",          // Light gray dividers
    white: "#FFFFFF",
} as const;

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 10,
        paddingTop: 36,
        paddingBottom: 36,
        paddingHorizontal: 40,
        color: COLORS.primary,
        lineHeight: 1.4,
    },

    // ── Header Section ──────────────────────────────────────────────────
    headerName: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        color: COLORS.accent,
        marginBottom: 2,
    },
    headerContact: {
        fontSize: 9,
        color: COLORS.muted,
        marginBottom: 16,
    },

    // ── Section ─────────────────────────────────────────────────────────
    sectionHeader: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        textTransform: "uppercase" as const,
        letterSpacing: 1,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        paddingBottom: 3,
        marginTop: 14,
        marginBottom: 8,
    },

    // ── Work Experience ─────────────────────────────────────────────────
    entryRow: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        marginBottom: 1,
    },
    entryTitle: {
        fontSize: 10.5,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
    },
    entrySubtitle: {
        fontSize: 9.5,
        color: COLORS.secondary,
        marginBottom: 3,
    },
    entryDate: {
        fontSize: 9,
        color: COLORS.muted,
        textAlign: "right" as const,
    },
    bullet: {
        fontSize: 9.5,
        color: COLORS.secondary,
        paddingLeft: 12,
        marginBottom: 2,
        lineHeight: 1.45,
    },
    entryBlock: {
        marginBottom: 10,
    },

    // ── Skills ──────────────────────────────────────────────────────────
    skillsText: {
        fontSize: 9.5,
        color: COLORS.secondary,
        lineHeight: 1.5,
    },

    // ── Summary ─────────────────────────────────────────────────────────
    summaryText: {
        fontSize: 9.5,
        color: COLORS.secondary,
        lineHeight: 1.5,
        marginBottom: 2,
    },

    // ── Education ───────────────────────────────────────────────────────
    eduBlock: {
        marginBottom: 6,
    },
});

// ── PDF Document Component ──────────────────────────────────────────────────

interface ResumePDFProps {
    resume: TailoredResumeOutput;
    candidateName: string;
    candidateEmail?: string;
}

function ResumePDF({ resume, candidateName, candidateEmail }: ResumePDFProps) {
    return React.createElement(
        Document,
        {
            title: `${candidateName} - Resume`,
            author: "CareerVelocity",
            subject: "Tailored Resume",
            creator: "CareerVelocity ATS Engine",
        },
        React.createElement(
            Page,
            { size: "LETTER", style: styles.page },

            // ── Candidate Header ──────────────────────────────────────────
            React.createElement(
                View,
                null,
                React.createElement(Text, { style: styles.headerName }, candidateName),
                candidateEmail &&
                React.createElement(
                    Text,
                    { style: styles.headerContact },
                    candidateEmail
                )
            ),

            // ── Professional Summary ──────────────────────────────────────
            resume.summary &&
            React.createElement(
                View,
                null,
                React.createElement(
                    Text,
                    { style: styles.sectionHeader },
                    "Professional Summary"
                ),
                React.createElement(
                    Text,
                    { style: styles.summaryText },
                    resume.summary
                )
            ),

            // ── Professional Experience ───────────────────────────────────
            resume.workHistory.length > 0 &&
            React.createElement(
                View,
                null,
                React.createElement(
                    Text,
                    { style: styles.sectionHeader },
                    "Professional Experience"
                ),
                ...resume.workHistory.map((job: TailoredWorkExperience, i: number) =>
                    React.createElement(
                        View,
                        { key: `work-${i}`, style: styles.entryBlock },
                        React.createElement(
                            View,
                            { style: styles.entryRow },
                            React.createElement(
                                Text,
                                { style: styles.entryTitle },
                                job.title
                            ),
                            React.createElement(
                                Text,
                                { style: styles.entryDate },
                                `${job.startDate} — ${job.endDate ?? "Present"}`
                            )
                        ),
                        React.createElement(
                            Text,
                            { style: styles.entrySubtitle },
                            [job.company, job.location].filter(Boolean).join(" | ")
                        ),
                        ...job.bullets.map((bullet: string, j: number) =>
                            React.createElement(
                                Text,
                                { key: `work-${i}-b-${j}`, style: styles.bullet },
                                `•  ${bullet}`
                            )
                        )
                    )
                )
            ),

            // ── Projects ──────────────────────────────────────────────────
            resume.projects &&
            resume.projects.length > 0 &&
            React.createElement(
                View,
                null,
                React.createElement(
                    Text,
                    { style: styles.sectionHeader },
                    "Projects"
                ),
                ...resume.projects.map((proj: TailoredProject, i: number) =>
                    React.createElement(
                        View,
                        { key: `proj-${i}`, style: styles.entryBlock },
                        React.createElement(
                            View,
                            { style: styles.entryRow },
                            React.createElement(
                                Text,
                                { style: styles.entryTitle },
                                proj.name
                            ),
                            proj.technologies.length > 0 &&
                            React.createElement(
                                Text,
                                { style: styles.entryDate },
                                proj.technologies.slice(0, 4).join(", ")
                            )
                        ),
                        React.createElement(
                            Text,
                            { style: styles.entrySubtitle },
                            proj.description
                        ),
                        ...proj.bullets.map((bullet: string, j: number) =>
                            React.createElement(
                                Text,
                                { key: `proj-${i}-b-${j}`, style: styles.bullet },
                                `•  ${bullet}`
                            )
                        )
                    )
                )
            ),

            // ── Technical Skills ──────────────────────────────────────────
            resume.skills.length > 0 &&
            React.createElement(
                View,
                null,
                React.createElement(
                    Text,
                    { style: styles.sectionHeader },
                    "Technical Skills"
                ),
                React.createElement(
                    Text,
                    { style: styles.skillsText },
                    resume.skills.join("  •  ")
                )
            ),

            // ── Education ─────────────────────────────────────────────────
            resume.education.length > 0 &&
            React.createElement(
                View,
                null,
                React.createElement(
                    Text,
                    { style: styles.sectionHeader },
                    "Education"
                ),
                ...resume.education.map((edu: Education, i: number) =>
                    React.createElement(
                        View,
                        { key: `edu-${i}`, style: styles.eduBlock },
                        React.createElement(
                            View,
                            { style: styles.entryRow },
                            React.createElement(
                                Text,
                                { style: styles.entryTitle },
                                `${edu.degree} in ${edu.fieldOfStudy}`
                            ),
                            React.createElement(
                                Text,
                                { style: styles.entryDate },
                                `${edu.startDate} — ${edu.endDate ?? "Present"}`
                            )
                        ),
                        React.createElement(
                            Text,
                            { style: styles.entrySubtitle },
                            [
                                edu.institution,
                                edu.gpa ? `GPA: ${edu.gpa}` : null,
                                edu.honors,
                            ].filter(Boolean).join("  |  ")
                        )
                    )
                )
            )
        )
    );
}

// ============================================================================
// Public API — Generate PDF Buffer
// ============================================================================

export interface PDFGenerateOptions {
    resume: TailoredResumeOutput;
    candidateName: string;
    candidateEmail?: string;
}

/**
 * Generate an ATS-safe PDF buffer from tailored resume JSON.
 *
 * ATS Compliance:
 * - Single-column, top-to-bottom reading order
 * - Helvetica font (universally parsed)
 * - Explicit section headers for Workday/Greenhouse
 * - No images, no tables, no multi-column layouts
 * - PDF metadata set for indexing
 */
export async function generateResumePDF(
    options: PDFGenerateOptions
): Promise<Buffer> {
    const element = React.createElement(ResumePDF, {
        resume: options.resume,
        candidateName: options.candidateName,
        candidateEmail: options.candidateEmail,
    });

    // Cast required: ResumePDF returns a <Document> at runtime, but TS sees
    // the wrapper component's props. This is a known @react-pdf/renderer typing gap.
    const buffer = await renderToBuffer(
        element as unknown as React.ReactElement<DocumentProps>
    );
    return Buffer.from(buffer);
}
