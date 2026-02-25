"use server";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const SEED_PRODUCTS = [
    {
        sku: "PRO-RESUME-PACK-01",
        name: "Premium ATS Resume Templates",
        description: "Stand out immediately with our curated collection of 5 beautifully designed, ATS-compliant resume templates used by engineers at FAANG.",
        price: 29.00,
        productType: "template",
        isActive: true,
        // Fake IDs for UI Demo. In production, these must exactly match actual Stripe Dashboard Product & Price IDs.
        stripeProductId: "prod_U2sVh7FohTe1u4",
        stripePriceId: null,
        accessUrl: "https://careervelocity.app/premium-downloads/resume-pack-01.zip",
    },
    {
        sku: "TECH-INTERVIEW-GUIDE-01",
        name: "The Ultimate Tech Interview Guide",
        description: "A comprehensive 50-page digital manual covering the STAR method, system design fundamentals, and behavioral psychology techniques.",
        price: 49.00,
        productType: "guide",
        isActive: true,
        stripeProductId: "prod_U2sV1QBvG4nNQf",
        stripePriceId: null,
        accessUrl: "https://careervelocity.app/premium-downloads/interview-guide-v2.pdf",
    },
    {
        sku: "COACHING-SESSION-45M",
        name: "1:1 Career Strategy Session",
        description: "A private 45-minute video call with a Senior Tech Recruiter. Get personalized feedback on your resume, portfolio, and interview strategy.",
        price: 199.00,
        productType: "coaching",
        isActive: true,
        stripeProductId: "prod_U2sVDBN1Tv5ZB8",
        stripePriceId: null,
        accessUrl: "https://calendly.com/careervelocity-coaching", // Private booking link
    }
];

export async function getStoreProducts() {
    try {
        // Auto-purge legacy mock items to force a re-seed with live Stripe IDs
        await prisma.digitalProduct.deleteMany({
            where: {
                stripeProductId: {
                    startsWith: "prod_mock",
                },
            },
        });

        let products = await prisma.digitalProduct.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" }
        });

        // Auto-seed the database if empty so the UI works immediately
        if (products.length === 0) {
            await prisma.digitalProduct.createMany({
                data: SEED_PRODUCTS,
                skipDuplicates: true,
            });
            products = await prisma.digitalProduct.findMany({
                where: { isActive: true },
                orderBy: { price: "asc" }
            });
        }

        return { success: true, data: products };
    } catch (error: any) {
        console.error("[Store] Error fetching products:", error);
        return { success: false, error: "Failed to load store inventory" };
    }
}

export async function getPurchaseHistory() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const history = await prisma.purchaseHistory.findMany({
            where: { userId: session.user.id },
            include: { digitalProduct: true },
            orderBy: { createdAt: "desc" }
        });

        return { success: true, data: history };
    } catch (error: any) {
        return { success: false, error: "Failed to load purchase history" };
    }
}
