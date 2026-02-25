"use client";

// ============================================================================
// CareerVelocity — Recent Activity Table
// Displays the 5 most recent job applications, color-coded by status.
// ============================================================================

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExternalLink, Clock, Building2 } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface RecentApplication {
    id: string;
    companyName: string;
    jobTitle: string;
    status: string;
    applicationDate: string | null;
    jobUrl: string | null;
    createdAt: string;
}

interface RecentActivityTableProps {
    applications: RecentApplication[];
}

// ── Status Badge Configuration ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
    string,
    { label: string; className: string; dotColor: string }
> = {
    SAVED: {
        label: "Saved",
        className: "status-saved",
        dotColor: "bg-slate-400",
    },
    TAILORING: {
        label: "Tailoring",
        className: "status-tailoring",
        dotColor: "bg-brand-400",
    },
    APPLIED: {
        label: "Applied",
        className: "status-applied",
        dotColor: "bg-accent-cyan",
    },
    INTERVIEW: {
        label: "Interview",
        className: "status-interview",
        dotColor: "bg-accent-amber",
    },
    REJECTED: {
        label: "Rejected",
        className: "status-rejected",
        dotColor: "bg-accent-rose",
    },
    OFFER: {
        label: "Offer",
        className: "status-offer",
        dotColor: "bg-accent-emerald",
    },
};

// ── Helper ──────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RecentActivityTable({
    applications,
}: RecentActivityTableProps) {
    if (applications.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass rounded-2xl p-8 text-center"
            >
                <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-semibold text-text-secondary mb-1">
                    No applications yet
                </h3>
                <p className="text-sm text-text-muted">
                    Use the Quick Tailor above to create your first tailored application.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* ── Table Header ───────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
                <span className="text-xs text-text-muted">
                    Last {applications.length} applications
                </span>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                Company
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                Position
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                Date
                            </th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                Link
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app, index) => {
                            const statusConfig =
                                STATUS_CONFIG[app.status] ?? STATUS_CONFIG.SAVED;

                            return (
                                <motion.tr
                                    key={app.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.05 * index }}
                                    className={cn(
                                        "border-b border-white/[0.03] last:border-b-0",
                                        "hover:bg-white/[0.02] transition-colors duration-150"
                                    )}
                                >
                                    {/* Company */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                                                {app.companyName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-text-primary truncate max-w-[180px]">
                                                {app.companyName}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Position */}
                                    <td className="px-6 py-4 text-text-secondary truncate max-w-[220px]">
                                        {app.jobTitle}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                                                statusConfig.className
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    statusConfig.dotColor
                                                )}
                                            />
                                            {statusConfig.label}
                                        </span>
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-text-muted text-xs">
                                            <Clock className="w-3 h-3" />
                                            {formatRelativeDate(
                                                app.applicationDate ?? app.createdAt
                                            )}
                                        </span>
                                    </td>

                                    {/* External Link */}
                                    <td className="px-6 py-4 text-right">
                                        {app.jobUrl ? (
                                            <a
                                                href={app.jobUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 text-text-muted hover:text-brand-400 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        ) : (
                                            <span className="text-text-muted/30">—</span>
                                        )}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
