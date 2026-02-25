"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function uploadAndParseResume(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file provided" };

  if (file.type !== "application/pdf") {
    return { success: false, error: "Only PDF files are currently supported." };
  }

  try {
    // 1. Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return { success: false, error: "Could not extract text from the PDF. It may be an image-based scan." };
    }

    // 2. Stream to OpenAI for structural conversion
    const prompt = `
Extract the following resume into a structured JSON object.
The JSON must strictly match the following schema exactly. Do not add any new root keys.

{
  "title": "A short, professional title describing the candidate based on the resume (e.g. Senior Software Engineer)",
  "summary": "A professional summary or objective, extracted from the resume or summarized if absent.",
  "workHistory": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "date": "Start Date - End Date",
      "description": "Responsibility 1\\nResponsibility 2\\nResponsibility 3" (Use literal \\n to separate bullet points exactly)
    }
  ],
  "education": [
    {
      "school": "School Name",
      "degree": "Degree and Major",
      "date": "Graduation Date or Range"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project Description"
    }
  ]
}

Return ONLY valid JSON without any markdown formatting wrappers or code blocks.

Resume Text:
${text}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0].message?.content;
    if (!resultText) throw new Error("Failed to receive structured data from OpenAI.");

    const parsed = JSON.parse(resultText);

    // 3. Save to database
    const newResume = await prisma.baseResume.create({
      data: {
        userId: session.user.id,
        title: parsed.title || "Uploaded Resume",
        summary: parsed.summary || "",
        workHistory: parsed.workHistory || [],
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
        originalName: file.name,
        mimeType: file.type,
      },
    });

    revalidatePath("/dashboard/resumes");

    return { success: true, data: newResume };
  } catch (error: any) {
    console.error("[RESUME_PARSE_ERROR]", error);
    return { success: false, error: error.message || "An unexpected error occurred while parsing the resume." };
  }
}
