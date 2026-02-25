// ============================================================================
// CareerVelocity — Applications Loading Skeleton
// Kanban-specific loading state with column placeholders.
// ============================================================================

export default function ApplicationsLoading() {
    const columns = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];

    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-56 skeleton rounded-lg" />
                <div className="h-4 w-80 skeleton rounded-md" />
            </div>

            {/* Kanban Skeleton */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <div
                        key={col}
                        className="flex-shrink-0 w-[280px] rounded-2xl bg-surface-800/50 border border-white/5"
                    >
                        {/* Column Header */}
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="h-4 w-20 skeleton rounded" />
                            <div className="h-5 w-6 skeleton rounded-md" />
                        </div>

                        {/* Card Skeletons */}
                        <div className="p-3 space-y-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="glass rounded-xl p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 skeleton rounded-lg" />
                                        <div className="space-y-1 flex-1">
                                            <div className="h-3.5 w-24 skeleton rounded" />
                                            <div className="h-3 w-32 skeleton rounded" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-16 skeleton rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
