"use client";

// ============================================================================
// CareerVelocity — Dashboard Error Boundary
// Catches rendering errors in dashboard routes and shows a recovery UI.
// ============================================================================

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error("[Dashboard Error]", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
                {/* Icon */}
                <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-rose/10 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-accent-rose" />
                </div>

                {/* Message */}
                <div>
                    <h2 className="text-lg font-bold text-text-primary">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                        {error.message || "An unexpected error occurred. Please try again."}
                    </p>
                    {error.digest && (
                        <p className="text-xs text-text-muted/50 mt-2 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                {/* Recovery */}
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                     gradient-brand text-white hover:opacity-90 transition-opacity"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        </div>
    );
}
