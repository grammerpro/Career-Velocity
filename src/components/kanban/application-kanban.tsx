"use client";

// ============================================================================
// CareerVelocity — Application Kanban Board
// Drag-and-drop pipeline with optimistic UI and document retrieval.
// ============================================================================

import { useState, useCallback, useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import KanbanColumn from "@/components/kanban/kanban-column";
import KanbanCard from "@/components/kanban/kanban-card";
import DocumentModal from "@/components/kanban/document-modal";
import { updateApplicationStatus } from "@/actions/applications";

// ── Types ───────────────────────────────────────────────────────────────────

export interface KanbanApplication {
    id: string;
    companyName: string;
    jobTitle: string;
    status: string;
    applicationDate: string | null;
    jobUrl: string | null;
    createdAt: string;
    hasTailoredDoc: boolean;
}

interface ApplicationKanbanProps {
    initialApplications: KanbanApplication[];
    userId: string;
}

// ── Column Definitions ──────────────────────────────────────────────────────

const COLUMNS = [
    { id: "SAVED", title: "Saved", color: "text-slate-400", dotColor: "bg-slate-400" },
    { id: "TAILORING", title: "Tailoring", color: "text-brand-400", dotColor: "bg-brand-400" },
    { id: "APPLIED", title: "Applied", color: "text-accent-cyan", dotColor: "bg-accent-cyan" },
    { id: "INTERVIEW", title: "Interviewing", color: "text-accent-amber", dotColor: "bg-accent-amber" },
    { id: "OFFER", title: "Offer", color: "text-accent-emerald", dotColor: "bg-accent-emerald" },
    { id: "REJECTED", title: "Rejected", color: "text-accent-rose", dotColor: "bg-accent-rose" },
] as const;

// ── Component ───────────────────────────────────────────────────────────────

export default function ApplicationKanban({
    initialApplications,
    userId,
}: ApplicationKanbanProps) {
    const [applications, setApplications] = useState(initialApplications);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Document modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalApp, setModalApp] = useState<KanbanApplication | null>(null);

    // DnD sensors — require 8px of movement before activating (prevents click hijack)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // ── Group applications by column ────────────────────────────────────────
    const grouped = useMemo(() => {
        const map: Record<string, KanbanApplication[]> = {};
        for (const col of COLUMNS) {
            map[col.id] = [];
        }
        for (const app of applications) {
            if (map[app.status]) {
                map[app.status].push(app);
            }
        }
        return map;
    }, [applications]);

    // ── The card being dragged ──────────────────────────────────────────────
    const activeApp = useMemo(
        () => applications.find((a) => a.id === activeId) ?? null,
        [applications, activeId]
    );

    // ── Drag Handlers ──────────────────────────────────────────────────────

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);

            if (!over) return;

            const appId = active.id as string;
            const newStatus = over.id as string;

            // Find the application
            const app = applications.find((a) => a.id === appId);
            if (!app || app.status === newStatus) return;

            // ── Optimistic Update ───────────────────────────────────────────
            const previousApps = [...applications];
            setApplications((prev) =>
                prev.map((a) =>
                    a.id === appId
                        ? {
                            ...a,
                            status: newStatus,
                            applicationDate:
                                newStatus === "APPLIED" && !a.applicationDate
                                    ? new Date().toISOString()
                                    : a.applicationDate,
                        }
                        : a
                )
            );

            // ── Server Sync ─────────────────────────────────────────────────
            const result = await updateApplicationStatus(
                userId,
                appId,
                newStatus as Parameters<typeof updateApplicationStatus>[2]
            );

            // Rollback on failure
            if (!result.success) {
                setApplications(previousApps);
                console.error("[Kanban] Status update failed:", result.error);
            }
        },
        [applications, userId]
    );

    // ── Document Modal ────────────────────────────────────────────────────
    const openDocModal = useCallback((app: KanbanApplication) => {
        setModalApp(app);
        setModalOpen(true);
    }, []);

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            dotColor={col.dotColor}
                            count={grouped[col.id].length}
                        >
                            {grouped[col.id].map((app) => (
                                <KanbanCard
                                    key={app.id}
                                    application={app}
                                    onRetrieveDocuments={() => openDocModal(app)}
                                    isDragging={app.id === activeId}
                                />
                            ))}
                        </KanbanColumn>
                    ))}
                </div>

                {/* Drag Overlay — shows floating card while dragging */}
                <DragOverlay>
                    {activeApp ? (
                        <div className="opacity-90 rotate-2 scale-105">
                            <KanbanCard
                                application={activeApp}
                                onRetrieveDocuments={() => { }}
                                isDragging={false}
                                isOverlay
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Document Retrieval Modal */}
            {modalApp && (
                <DocumentModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    applicationId={modalApp.id}
                    userId={userId}
                    companyName={modalApp.companyName}
                    jobTitle={modalApp.jobTitle}
                />
            )}
        </>
    );
}
