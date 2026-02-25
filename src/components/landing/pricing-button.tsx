"use client";

// ============================================================================
// CareerVelocity — Pricing Tier Button
// Handles the checkout flow or redirects to dashboard for free tiers.
// ============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/actions/stripe-checkout";
import { Loader2 } from "lucide-react";

interface PricingButtonProps {
    tierName: string;
    cta: string;
    highlighted: boolean;
    priceId?: string;
}

export function PricingButton({ tierName, cta, highlighted, priceId }: PricingButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        // Free tier goes to dashboard
        if (!priceId || tierName === "Free") {
            router.push("/dashboard");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await createCheckoutSession(priceId);

            if (result.error) {
                if (result.redirect) {
                    router.push(result.redirect);
                } else {
                    setError(result.error);
                }
                return;
            }

            if (result.url) {
                window.location.href = result.url;
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-auto flex flex-col gap-2">
            <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={`w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${highlighted
                    ? "bg-white text-brand-600 hover:bg-white/90"
                    : "bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
                    } ${isLoading ? "opacity-70 pointer-events-none" : ""}`}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : cta}
            </button>
            {error && (
                <p className="text-red-400 text-xs text-center font-medium">{error}</p>
            )}
        </div>
    );
}
