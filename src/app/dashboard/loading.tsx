// ============================================================================
// CareerVelocity — Dashboard Loading Skeleton
// Shown while server components are fetching data.
// ============================================================================

export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-64 skeleton rounded-lg" />
                <div className="h-4 w-96 skeleton rounded-md" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="glass rounded-2xl p-6 space-y-3"
                    >
                        <div className="h-4 w-24 skeleton rounded" />
                        <div className="h-8 w-16 skeleton rounded" />
                    </div>
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="h-5 w-40 skeleton rounded" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 skeleton rounded-xl" />
                    ))}
                </div>
                <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="h-5 w-48 skeleton rounded" />
                    <div className="h-40 skeleton rounded-xl" />
                    <div className="h-10 w-32 skeleton rounded-xl" />
                </div>
            </div>
        </div>
    );
}
