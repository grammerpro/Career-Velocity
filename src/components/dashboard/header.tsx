"use client";

// ============================================================================
// CareerVelocity — Dashboard Header
// Displays user subscription tier badge and AI quota progress bar.
// ============================================================================

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Crown, Zap, SparklesIcon } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface DashboardHeaderProps {
    userName: string | null;
    subscriptionStatus: string;
    aiQuotaUsed: number;
    aiQuotaLimit: number;
}

// ── Subscription Display Config ─────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; icon: typeof Crown }> = {
    FREE: {
        label: "Free Tier",
        color: "from-slate-500 to-slate-400",
        icon: Zap,
    },
    PRO_1M: {
        label: "Pro Monthly",
        color: "from-brand-500 to-accent-cyan",
        icon: Crown,
    },
    PRO_6M: {
        label: "Pro Annual",
        color: "from-brand-600 to-accent-emerald",
        icon: SparklesIcon,
    },
};

// ── Component ───────────────────────────────────────────────────────────────

export default function DashboardHeader({
    userName,
    subscriptionStatus,
    aiQuotaUsed,
    aiQuotaLimit,
}: DashboardHeaderProps) {
    const tier = TIER_CONFIG[subscriptionStatus] ?? TIER_CONFIG.FREE;
    const TierIcon = tier.icon;
    const remaining = Math.max(0, aiQuotaLimit - aiQuotaUsed);
    const usagePercent = aiQuotaLimit > 0 ? (aiQuotaUsed / aiQuotaLimit) * 100 : 0;
    const isLow = usagePercent >= 80;
    const isExhausted = remaining <= 0;

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <header className="glass rounded-2xl px-6 py-4 flex items-center justify-between gap-6">
            {/* ── Left: Greeting ──────────────────────────────────────────────── */}
            <div className="min-w-0">
                <p className="text-sm text-text-muted">{greeting},</p>
                <h1 className="text-xl font-bold text-text-primary truncate">
                    {userName ?? "Welcome back"}
                </h1>
            </div>

            {/* ── Right: Tier Badge + Quota ───────────────────────────────────── */}
            <div className="flex items-center gap-5 flex-shrink-0">
                {/* Subscription Badge */}
                <div
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold",
                        "bg-gradient-to-r text-white shadow-lg shadow-brand-500/10",
                        tier.color
                    )}
                >
                    <TierIcon className="w-4 h-4" />
                    <span>{tier.label}</span>
                </div>

                {/* AI Quota Progress */}
                <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between w-full text-xs">
                        <span className="text-text-muted">AI Generations</span>
                        <span
                            className={cn(
                                "font-mono font-semibold",
                                isExhausted
                                    ? "text-accent-rose"
                                    : isLow
                                        ? "text-accent-amber"
                                        : "text-text-primary"
                            )}
                        >
                            {remaining}/{aiQuotaLimit} left
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-surface-600 overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full rounded-full transition-colors",
                                isExhausted
                                    ? "bg-accent-rose"
                                    : isLow
                                        ? "bg-gradient-to-r from-accent-amber to-accent-rose"
                                        : "bg-gradient-to-r from-brand-500 to-accent-cyan"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
