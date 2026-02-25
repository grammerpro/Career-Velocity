"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type InterviewQuestion = {
    id: string;
    type: "behavioral" | "technical";
    question: string;
    rationale: string;
    tips: string[];
};

export type InterviewPrepData = {
    questions: InterviewQuestion[];
};

export async function generateInterviewPrep(applicationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const userId = session.user.id;

        // Fetch application & document
        const application = await prisma.jobApplication.findFirst({
            where: {
                id: applicationId,
                userId: userId,
            },
            include: {
                tailoredDocument: true,
            },
        });

        if (!application || !application.tailoredDocument) {
            return { success: false, error: "Application or Document not found" };
        }

        const doc = application.tailoredDocument;

        // Return cached version if it exists
        if ((doc as any).interviewPrep) {
            return {
                success: true,
                data: (doc as any).interviewPrep as InterviewPrepData,
            };
        }

        // Generate new questions via OpenAI
        const prompt = `
You are an expert technical recruiter and hiring manager. 
Your task is to generate 5 highly specific mock interview questions for a candidate applying to the following job configuration.

TARGET JOB TITLE:
${application.jobTitle}

COMPANY:
${application.companyName}

JOB DESCRIPTION:
${application.rawDescription}

CANDIDATE's TAILORED RESUME:
${JSON.stringify(doc.tailoredResume, null, 2)}

REQUIREMENTS:
1. Generate exactly 5 questions (3 behavioral, 2 technical/domain-specific).
2. The questions must be uniquely tailored to the candidate's actual work experience listed in their resume AND the specific requirements in the job description.
3. For each question, provide a 'rationale' (why the interviewer is asking this based on the JD) and 2-3 specific 'tips' on how the candidate should structure their answer using the STAR method based on their actual resume bullet points.

Respond ONLY with valid JSON matching this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "behavioral",
      "question": "string",
      "rationale": "string",
      "tips": ["string"]
    }
  ]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const resultJson = completion.choices[0].message.content;
        if (!resultJson) throw new Error("No response from AI");

        const parsedData = JSON.parse(resultJson) as InterviewPrepData;

        // Save to Database
        await prisma.tailoredDocument.update({
            where: { id: doc.id },
            data: {
                interviewPrep: parsedData as any,
            } as any,
        });

        revalidatePath(`/dashboard/interview-prep/${applicationId}`);

        return {
            success: true,
            data: parsedData,
        };
    } catch (error: any) {
        console.error("[IntervewPrep] Error:", error);
        return { success: false, error: error.message || "Failed to generate interview prep" };
    }
}
