"use client";

// ============================================================================
// CareerVelocity — Statistical Data Cards
// Three animated cards: Total Applications, Active Interviews, Success Rate.
// ============================================================================

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Briefcase, MessageSquare, TrendingUp } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    gradient: string;
    shadowColor: string;
    delay?: number;
}

interface StatsOverviewProps {
    totalApplications: number;
    activeInterviews: number;
    successRate: number;
}

// ── Single Card ─────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    gradient,
    shadowColor,
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={cn(
                "glass rounded-2xl p-6 flex flex-col gap-4",
                "hover:scale-[1.02] transition-transform duration-200"
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">{label}</span>
                <div
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                        gradient,
                        shadowColor
                    )}
                >
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>

            <div>
                <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
                {subtitle && (
                    <p className="text-xs text-text-muted mt-1">{subtitle}</p>
                )}
            </div>
        </motion.div>
    );
}

// ── Stats Overview Grid ─────────────────────────────────────────────────────

export default function StatsOverview({
    totalApplications,
    activeInterviews,
    successRate,
}: StatsOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                label="Total Applications"
                value={totalApplications}
                subtitle="Tracked across all stages"
                icon={Briefcase}
                gradient="bg-gradient-to-br from-brand-500 to-brand-700"
                shadowColor="shadow-brand-500/25"
                delay={0}
            />
            <StatCard
                label="Active Interviews"
                value={activeInterviews}
                subtitle="Currently in pipeline"
                icon={MessageSquare}
                gradient="bg-gradient-to-br from-accent-amber to-orange-500"
                shadowColor="shadow-amber-500/25"
                delay={0.1}
            />
            <StatCard
                label="Success Rate"
                value={`${successRate}%`}
                subtitle="Application to interview conversion"
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-accent-emerald to-teal-600"
                shadowColor="shadow-emerald-500/25"
                delay={0.2}
            />
        </div>
    );
}
