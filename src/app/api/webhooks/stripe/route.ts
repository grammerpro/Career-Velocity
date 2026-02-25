// ============================================================================
// CareerVelocity — Stripe Webhook Handler
// Processes incoming Stripe events with cryptographic signature verification.
//
// Handled events:
//   • checkout.session.completed  → digital product fulfillment OR subscription
//   • customer.subscription.updated → tier upgrade/change + quota reset
//   • invoice.payment_succeeded    → recurring billing confirmation + quota reset
//   • customer.subscription.deleted → graceful downgrade to free tier
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import {
    getStripe,
    resolveTierFromPriceId,
    FREE_TIER,
} from "@/lib/stripe";

// ── Disable body parsing — Stripe requires raw body for signature ───────────

export const dynamic = "force-dynamic";

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET");
        return NextResponse.json(
            { error: "Webhook secret not configured" },
            { status: 500 }
        );
    }

    // ── Step 1: Read raw body + verify signature ────────────────────────────

    let event: Stripe.Event;

    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing stripe-signature header" },
                { status: 400 }
            );
        }

        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
        return NextResponse.json(
            { error: `Webhook signature verification failed: ${message}` },
            { status: 400 }
        );
    }

    // ── Step 2: Route to handler ────────────────────────────────────────────

    try {
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case "customer.subscription.updated":
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case "invoice.payment_succeeded":
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                // Unhandled event type — acknowledge receipt silently
                console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
        }
    } catch (error) {
        console.error(`[Stripe Webhook] Handler error for ${event.type}:`, error);
        // Return 500 so Stripe retries the webhook
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({ received: true }, { status: 200 });
}

// ============================================================================
// Event Handlers
// ============================================================================

// ── checkout.session.completed ──────────────────────────────────────────────
// Handles BOTH subscription checkouts AND one-time digital product purchases.

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const customerId = session.customer as string | null;
    if (!customerId) {
        console.warn("[Stripe Webhook] checkout.session.completed missing customer ID");
        return;
    }

    // Find the user by Stripe customer ID
    const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true },
    });

    if (!user) {
        console.error(`[Stripe Webhook] No user found for Stripe customer: ${customerId}`);
        return;
    }

    // ── Digital Product Purchase (one-time) ─────────────────────────────────
    if (session.mode === "payment") {
        await fulfillDigitalProductPurchase(user.id, session);
        return;
    }

    // ── Subscription Checkout ───────────────────────────────────────────────
    if (session.mode === "subscription" && session.subscription) {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ["items.data.price"] }
        );
        await activateSubscription(user.id, subscription);
    }
}

// ── customer.subscription.updated ───────────────────────────────────────────
// Fires on plan changes, trial endings, or billing cycle updates.

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true },
    });

    if (!user) {
        console.error(`[Stripe Webhook] No user for customer: ${customerId}`);
        return;
    }

    // Only activate if subscription is in an active state
    if (subscription.status === "active" || subscription.status === "trialing") {
        await activateSubscription(user.id, subscription);
    } else if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid" ||
        subscription.status === "past_due"
    ) {
        // Gracefully downgrade on non-active states
        await downgradeToFree(user.id);
    }
}

// ── invoice.payment_succeeded ───────────────────────────────────────────────
// Fires on successful recurring payments — perfect time to reset the quota.

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Stripe SDK v20 restructured the Invoice type — cast to access properties
    const invoiceData = invoice as unknown as Record<string, unknown>;

    // Only process subscription invoices (skip one-time)
    const subscriptionId =
        typeof invoiceData.subscription === "string"
            ? invoiceData.subscription
            : null;
    if (!subscriptionId) return;

    const customerId =
        typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as { id: string } | null)?.id;
    if (!customerId) return;

    const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true },
    });

    if (!user) {
        console.error(`[Stripe Webhook] No user for customer: ${customerId}`);
        return;
    }

    // Resolve the tier from the invoice line items
    const linesData = invoiceData.lines as { data?: Array<Record<string, unknown>> } | undefined;
    const firstLine = linesData?.data?.[0];
    const linePrice = firstLine?.price as { id?: string } | undefined;
    const priceId = linePrice?.id;
    if (!priceId) return;

    const tier = resolveTierFromPriceId(priceId);
    if (!tier) {
        console.warn(`[Stripe Webhook] Unknown price ID in invoice: ${priceId}`);
        return;
    }

    // Reset quota for the new billing cycle
    await prisma.user.update({
        where: { id: user.id },
        data: {
            subscriptionStatus: tier.subscriptionStatus,
            aiQuotaLimit: tier.aiQuotaLimit,
            aiQuotaUsed: 0, // Reset counter for new billing period
            quotaResetDate: new Date(),
        },
    });

    console.log(
        `[Stripe Webhook] Quota reset for user ${user.id}: ${tier.label} (${tier.aiQuotaLimit} credits)`
    );
}

// ── customer.subscription.deleted ───────────────────────────────────────────
// Fires when a subscription is fully canceled (end of billing period).

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true },
    });

    if (!user) {
        console.error(`[Stripe Webhook] No user for customer: ${customerId}`);
        return;
    }

    await downgradeToFree(user.id);

    console.log(
        `[Stripe Webhook] User ${user.id} downgraded to free tier (subscription deleted)`
    );
}

// ============================================================================
// Shared Logic
// ============================================================================

/**
 * Activate a subscription: resolve tier from price, update user status + quota.
 */
async function activateSubscription(
    userId: string,
    subscription: Stripe.Subscription
) {
    // Extract the price ID from the first subscription item
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
        console.warn("[Stripe Webhook] Subscription has no price ID");
        return;
    }

    const tier = resolveTierFromPriceId(priceId);
    if (!tier) {
        console.warn(`[Stripe Webhook] Unknown price ID: ${priceId}`);
        return;
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            subscriptionStatus: tier.subscriptionStatus,
            aiQuotaLimit: tier.aiQuotaLimit,
            aiQuotaUsed: 0, // Fresh quota on activation
            quotaResetDate: new Date(),
        },
    });

    console.log(
        `[Stripe Webhook] Subscription activated for user ${userId}: ${tier.label}`
    );
}

/**
 * Graceful downgrade: revert to free tier.
 * CRITICAL: Data integrity is maintained — no records are deleted.
 * Historical tailored documents, applications, and purchase history remain intact.
 * Only the access level and quota are reduced.
 */
async function downgradeToFree(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            subscriptionStatus: FREE_TIER.subscriptionStatus,
            aiQuotaLimit: FREE_TIER.aiQuotaLimit,
            aiQuotaUsed: 0,
            quotaResetDate: null,
        },
    });
}

/**
 * Fulfill a digital product purchase:
 * 1. Resolve the product from Stripe metadata or line items
 * 2. Insert into PurchaseHistory
 * 3. Content is unlocked by existence of the purchase record
 */
async function fulfillDigitalProductPurchase(
    userId: string,
    session: Stripe.Checkout.Session
) {
    const stripe = getStripe();

    // Retrieve line items to find the purchased product
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 10,
        expand: ["data.price.product"],
    });

    for (const item of lineItems.data) {
        const stripeProductId =
            typeof item.price?.product === "string"
                ? item.price.product
                : (item.price?.product as Stripe.Product)?.id;

        if (!stripeProductId) continue;

        // Find our internal product by Stripe product ID
        const product = await prisma.digitalProduct.findUnique({
            where: { stripeProductId },
            select: { id: true, price: true },
        });

        if (!product) {
            console.warn(
                `[Stripe Webhook] Digital product not found for Stripe product: ${stripeProductId}`
            );
            continue;
        }

        // Idempotency: skip if already fulfilled (duplicate webhook)
        const existing = await prisma.purchaseHistory.findUnique({
            where: { stripeTransactionId: session.payment_intent as string },
        });

        if (existing) {
            console.log(
                `[Stripe Webhook] Purchase already fulfilled: ${session.payment_intent}`
            );
            continue;
        }

        // Insert purchase record — this IS the content unlock mechanism.
        // Access checks query: "Does a PurchaseHistory record exist for this user + product?"
        await prisma.purchaseHistory.create({
            data: {
                userId,
                digitalProductId: product.id,
                stripeTransactionId: session.payment_intent as string,
                amount: product.price,
                currency: session.currency ?? "usd",
                status: "completed",
                receiptUrl: (session as unknown as Record<string, unknown>).receipt_url as string | undefined,
            },
        });

        console.log(
            `[Stripe Webhook] Digital product fulfilled: ${stripeProductId} for user ${userId}`
        );
    }
}
