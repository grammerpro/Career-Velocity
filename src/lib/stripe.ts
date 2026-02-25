// ============================================================================
// CareerVelocity — Stripe Client + Configuration
// Singleton Stripe instance and subscription tier definitions.
// ============================================================================

import Stripe from "stripe";

// ── Stripe Singleton ────────────────────────────────────────────────────────

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
});

export function getStripe() {
    return stripe;
}

// ── Subscription Tier Definitions ───────────────────────────────────────────

export interface TierConfig {
    subscriptionStatus: "FREE" | "PRO_1M" | "PRO_6M";
    aiQuotaLimit: number;
    label: string;
}

/**
 * Maps Stripe Price IDs → internal tier config.
 */
export const TIER_MAP: Record<string, TierConfig> = {
    // Monthly Pro
    [process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!]: {
        subscriptionStatus: "PRO_1M",
        aiQuotaLimit: 50,
        label: "Pro Monthly",
    },
    // 6-Month Pro
    [process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID!]: {
        subscriptionStatus: "PRO_6M",
        aiQuotaLimit: 100,
        label: "Pro Annual",
    },
};

/**
 * Resolve a tier config from Stripe line items.
 * Falls back to the first matching price ID.
 */
export function resolveTierFromPriceId(priceId: string): TierConfig | null {
    return TIER_MAP[priceId] ?? null;
}

// ── Free Tier Defaults ──────────────────────────────────────────────────────

export const FREE_TIER: TierConfig = {
    subscriptionStatus: "FREE",
    aiQuotaLimit: 5,
    label: "Free",
};
