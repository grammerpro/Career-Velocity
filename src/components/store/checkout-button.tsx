"use client";

import { useState } from "react";

import { Loader2, ShoppingCart, LockOpen } from "lucide-react";
import { createStoreCheckoutSession } from "@/actions/stripe-checkout";

interface CheckoutButtonProps {
    productId: string;
    isPurchased: boolean;
    accessUrl: string | null;
    price: number;
}

export function CheckoutButton({ productId, isPurchased, accessUrl, price }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await createStoreCheckoutSession(productId);
            if (result?.error) {
                setError(result.error);
                if (result.redirect) {
                    window.location.href = result.redirect;
                }
            } else if (result?.url) {
                window.location.href = result.url;
            }
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isPurchased) {
        return (
            <button
                className="w-full flex items-center justify-center py-2 px-4 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 border border-green-500/20 transition-all font-semibold"
                onClick={() => {
                    if (accessUrl) window.open(accessUrl, "_blank");
                }}
            >
                <LockOpen className="w-4 h-4 mr-2" />
                Access Content
            </button>
        );
    }

    return (
        <div className="w-full space-y-2">
            <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-2 px-4 rounded-lg bg-brand-500 hover:bg-brand-400 text-white font-semibold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Redirecting to Stripe..." : `Buy Now for $${price.toFixed(2)}`}
            </button>
            {error && (
                <p className="text-sm text-red-500 text-center animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
}
