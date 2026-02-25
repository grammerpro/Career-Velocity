"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTailoredResume(baseResumeId: string, jobDescription: string, forceUserId?: string) {
    let userId = forceUserId;
    if (!userId) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        userId = session.user.id;
    }

    try {
        // 1. Fetch user to check quotas
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { aiQuotaUsed: true, aiQuotaLimit: true }
        });

        if (!user) return { success: false, error: "User not found" };
        if (user.aiQuotaUsed >= user.aiQuotaLimit) {
            return { success: false, error: "You have exceeded your AI generation quota. Please upgrade your plan." };
        }

        // 2. Fetch the Base Resume
        const baseResume = await prisma.baseResume.findUnique({
            where: { id: baseResumeId, userId: userId }
        });

        if (!baseResume) return { success: false, error: "Base resume not found" };

        // 3. Prepare OpenAI Prompt
        const prompt = `
You are an expert Executive Resume Writer and ATS Optimization Specialist.
Your task is to take the user's "Base Resume" data and a "Target Job Description", and rewrite the resume to perfectly map to the job requirements.

**Rules:**
1. DO NOT fabricate experience, degrees, or jobs out of thin air. Only reframe, emphasize, or expand upon the user's existing experience to match the keywords and tone of the Job Description.
2. Rewrite the "summary" to be a powerful 3-4 sentence hook exactly tailored to the job description.
3. For "workHistory", extract and rewrite the bullet points ("description") to highlight relevant achievements using strong action verbs and quantifying results where possible. Use '\n' to separate bullet points in the description string.
4. For "skills", re-order or swap out skills based on the keywords found in the Job Description.

**Target Job Description:**
${jobDescription}

**Base Resume JSON Data:**
Title: ${baseResume.title}
Summary: ${baseResume.summary || ""}
Education: ${JSON.stringify(baseResume.education)}
Work History: ${JSON.stringify(baseResume.workHistory)}
Skills: ${JSON.stringify(baseResume.skills)}
Projects: ${JSON.stringify(baseResume.projects)}

**Response Format:**
Respond ONLY with a valid JSON object matching this exact schema:
{
  "title": "A highly targeted professional title (e.g., Senior React Engineer)",
  "summary": "The rewritten tailored summary",
  "workHistory": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "date": "Start Date - End Date",
      "description": "Responsibility 1\\nResponsibility 2"
    }
  ],
  "education": [
    { "school": "Name", "degree": "Degree", "date": "Date" }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "projects": [
    { "name": "Name", "description": "Desc" }
  ],
  "metadata": {
    "extractedCompanyName": "The name of the company from the Job Description (if found, else 'Unknown Company')",
    "extractedJobTitle": "The exact title of the role from the Job Description"
  }
}
`;

        // 4. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const resultText = response.choices[0].message?.content;
        if (!resultText) throw new Error("Failed to generate a response from OpenAI.");

        const tailoredData = JSON.parse(resultText);

        // Extract metadata and remove it from the final resume payload
        const companyName = tailoredData.metadata?.extractedCompanyName || "Unknown Company";
        const jobTitle = tailoredData.metadata?.extractedJobTitle || "Targeted Role";
        delete tailoredData.metadata;

        // 5. Database Transaction: Deduct Quota, Create Application, Create Tailored Document
        const [jobApp] = await prisma.$transaction([
            // Create Job Application
            prisma.jobApplication.create({
                data: {
                    userId: userId,
                    companyName,
                    jobTitle,
                    rawDescription: jobDescription,
                    status: "SAVED",
                    tailoredDocument: {
                        create: {
                            tailoredResume: tailoredData,
                            modelUsed: "gpt-4o",
                        }
                    }
                }
            }),
            // Increment Quota
            prisma.user.update({
                where: { id: userId },
                data: { aiQuotaUsed: { increment: 1 } }
            })
        ]);

        // 6. Return Success and Redirect ID
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/applications");

        return { success: true, applicationId: jobApp.id };

    } catch (error: any) {
        console.error("[AI_MATCHER_ERROR]", error);
        return { success: false, error: error.message || "An unexpected error occurred during AI generation." };
    }
}
