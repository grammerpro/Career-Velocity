"use client";

// ============================================================================
// CareerVelocity — Kanban Column (Drop Target)
// Each column is a droppable container for application cards.
// ============================================================================

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    color: string;
    dotColor: string;
    count: number;
    children: React.ReactNode;
}

export default function KanbanColumn({
    id,
    title,
    color,
    dotColor,
    count,
    children,
}: KanbanColumnProps) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-shrink-0 w-[280px] flex flex-col rounded-2xl transition-all duration-200",
                "bg-surface-800/50 border",
                isOver
                    ? "border-brand-500/40 bg-brand-500/5 shadow-lg shadow-brand-500/10"
                    : "border-white/5"
            )}
        >
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", dotColor)} />
                    <h3 className={cn("text-sm font-semibold", color)}>{title}</h3>
                </div>
                <span className="text-xs font-mono text-text-muted bg-surface-700 px-2 py-0.5 rounded-md">
                    {count}
                </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[120px]">
                {children}
            </div>
        </div>
    );
}
