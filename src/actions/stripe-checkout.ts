"use server";

// ============================================================================
// CareerVelocity — Stripe Checkout Action
// ============================================================================

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function createCheckoutSession(priceId: string) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session?.user?.email) {
            return {
                error: "You must be signed in to upgrade. Please sign in or create an account first.",
                redirect: "/auth/signin"
            };
        }

        // Check if user already has a Stripe customer ID, otherwise create one
        let customerId = session.user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                metadata: {
                    userId: session.user.id,
                },
            });

            customerId = customer.id;

            await prisma.user.update({
                where: { id: session.user.id },
                data: { stripeCustomerId: customer.id },
            });
        }

        // Create the highly-optimized Stripe Checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/?checkout=canceled`,
            metadata: {
                userId: session.user.id,
            },
        });

        if (!checkoutSession.url) {
            throw new Error("Failed to create checkout session URL");
        }

        return { url: checkoutSession.url };

    } catch (error) {
        console.error("[STRIPE_CHECKOUT_ERROR]", error);
        return { error: "An unexpected error occurred. Please try again later." };
    }
}

// ── One-Time Digital Product Checkout ───────────────────────────────────────

export async function createStoreCheckoutSession(productId: string) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session?.user?.email) {
            return {
                error: "You must be signed in to purchase items.",
                redirect: "/auth/signin"
            };
        }

        const product = await prisma.digitalProduct.findUnique({
            where: { id: productId },
        });

        if (!product || !product.stripeProductId || !product.isActive) {
            return { error: "This product is currently unavailable." };
        }

        let customerId = session.user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                metadata: { userId: session.user.id },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: session.user.id },
                data: { stripeCustomerId: customer.id },
            });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product: product.stripeProductId!, // Matches the pre-configured Stripe Product
                        unit_amount: Math.round(Number(product.price) * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXTAUTH_URL}/dashboard/store?checkout=success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/store?checkout=canceled`,
            metadata: {
                userId: session.user.id,
                productId: product.id,
            },
        });

        if (!checkoutSession.url) {
            throw new Error("Failed to create store checkout session URL");
        }

        return { url: checkoutSession.url };

    } catch (error) {
        console.error("[STRIPE_STORE_CHECKOUT_ERROR]", error);
        return { error: "An unexpected error occurred initiating checkout." };
    }
}
