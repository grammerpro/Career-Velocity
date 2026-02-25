"use client";

// ============================================================================
// CareerVelocity — Kanban Card (Draggable)
// Individual application card with drag handle and "Retrieve Documents" button.
// ============================================================================

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    GripVertical,
    FileSearch,
    ExternalLink,
    Clock,
    Globe,
} from "lucide-react";
import Link from "next/link";
import type { KanbanApplication } from "@/components/kanban/application-kanban";

// ── Types ───────────────────────────────────────────────────────────────────

interface KanbanCardProps {
    application: KanbanApplication;
    onRetrieveDocuments: () => void;
    isDragging: boolean;
    isOverlay?: boolean;
}

// ── Helper ──────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

// ── Component ───────────────────────────────────────────────────────────────

export default function KanbanCard({
    application,
    onRetrieveDocuments,
    isDragging,
    isOverlay = false,
}: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: application.id,
    });

    const style = transform
        ? {
            transform: CSS.Translate.toString(transform),
        }
        : undefined;

    return (
        <motion.div
            ref={!isOverlay ? setNodeRef : undefined}
            style={!isOverlay ? style : undefined}
            layout
            layoutId={!isOverlay ? application.id : undefined}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
                opacity: isDragging ? 0.4 : 1,
                scale: isDragging ? 0.95 : 1,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "group glass rounded-xl p-3 cursor-grab active:cursor-grabbing",
                "hover:border-brand-500/25 transition-all duration-150",
                isOverlay && "shadow-2xl shadow-brand-500/20 border-brand-500/30"
            )}
        >
            {/* Top Row: Drag Handle + Company */}
            <div className="flex items-start gap-2">
                <button
                    {...listeners}
                    {...attributes}
                    className="mt-0.5 p-0.5 rounded text-text-muted/40 hover:text-text-muted transition-colors cursor-grab active:cursor-grabbing"
                    aria-label="Drag to move"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {/* Company Monogram */}
                        <div className="w-7 h-7 rounded-lg bg-surface-600 flex items-center justify-center text-[10px] font-bold text-brand-300 flex-shrink-0">
                            {application.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">
                                {application.companyName}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                                {application.jobTitle}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Date + Actions */}
            <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                    <Clock className="w-3 h-3" />
                    {formatShortDate(application.applicationDate ?? application.createdAt)}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* View Full Application Link */}
                    <Link
                        href={`/dashboard/applications/${application.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium",
                            "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white",
                            "transition-all duration-150"
                        )}
                        title="Open full application details"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Open
                    </Link>

                    {/* Retrieve Documents Button */}
                    {application.hasTailoredDoc && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRetrieveDocuments();
                            }}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium",
                                "bg-brand-500/10 text-brand-300 hover:bg-brand-500/20",
                                "transition-all duration-150"
                            )}
                            title="Retrieve tailored documents"
                        >
                            <FileSearch className="w-3 h-3" />
                            Docs
                        </button>
                    )}

                    {/* External Link */}
                    {application.jobUrl && (
                        <a
                            href={application.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-lg text-text-muted hover:text-brand-400 hover:bg-white/5 transition-all"
                        >
                            <Globe className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
