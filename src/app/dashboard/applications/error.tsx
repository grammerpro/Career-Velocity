"use client";

// ============================================================================
// CareerVelocity — Applications Error Boundary
// ============================================================================

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ApplicationsError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error("[Applications Error]", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-rose/10 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-accent-rose" />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-text-primary">
                        Failed to load applications
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                        {error.message || "Could not fetch your application board. Please try again."}
                    </p>
                </div>

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                     gradient-brand text-white hover:opacity-90 transition-opacity"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reload Board
                </button>
            </div>
        </div>
    );
}
