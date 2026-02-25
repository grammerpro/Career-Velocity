"use client";

// ============================================================================
// CareerVelocity — Rapid Action Client Wrapper
// Thin client component that bridges the server action with the UI module.
// ============================================================================

import RapidActionModule from "@/components/dashboard/rapid-action-module";
import { generateTailoredResume } from "@/actions/ai-matcher";

interface RapidActionClientProps {
    baseResumes: { id: string; title: string }[];
    userId: string;
}

export default function RapidActionClient({
    baseResumes,
    userId,
}: RapidActionClientProps) {
    const handleTailor = async (data: {
        jobDescription: string;
        companyName: string;
        jobTitle: string;
        baseResumeId: string;
    }) => {
        // Call the server action
        const result = await generateTailoredResume(
            data.baseResumeId,
            data.jobDescription
        );

        return {
            success: result.success,
            error: !result.success ? result.error : undefined,
        };
    };

    return (
        <RapidActionModule baseResumes={baseResumes} onTailor={handleTailor} />
    );
}
