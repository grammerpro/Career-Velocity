"use client";

// ============================================================================
// CareerVelocity — Sidebar Navigation
// Persistent sidebar with route links, brand logo, and user subscription badge.
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Wand2,
    Kanban,
    Brain,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    Zap,
} from "lucide-react";

// ── Navigation Routes ───────────────────────────────────────────────────────

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/resumes", label: "Base Resumes", icon: FileText },
    { href: "/dashboard/matcher", label: "AI Job Matcher", icon: Wand2 },
    { href: "/dashboard/applications", label: "Application Board", icon: Kanban },
    { href: "/dashboard/interview-prep", label: "Interview Prep", icon: Brain },
    { href: "/dashboard/store", label: "Digital Store", icon: ShoppingBag },
] as const;

// ── Component ───────────────────────────────────────────────────────────────

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen flex flex-col print:hidden",
                "glass border-r border-white/5 transition-all duration-300 ease-in-out",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* ── Brand Logo ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <AnimatePresence mode="wait">
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden gradient-brand-text"
                        >
                            CareerVelocity
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Navigation Links ───────────────────────────────────────────── */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                "text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "text-white bg-brand-500/15"
                                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                            )}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full gradient-brand"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}

                            <item.icon
                                className={cn(
                                    "flex-shrink-0 w-5 h-5 transition-colors",
                                    isActive ? "text-brand-400" : "text-text-muted group-hover:text-brand-300"
                                )}
                            />

                            <AnimatePresence mode="wait">
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Collapse Toggle ────────────────────────────────────────────── */}
            <div className="px-3 py-4 border-t border-white/5">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "flex items-center justify-center w-full py-2 rounded-xl",
                        "text-text-muted hover:text-text-primary hover:bg-white/5",
                        "transition-all duration-200"
                    )}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </button>
            </div>
        </aside>
    );
}
