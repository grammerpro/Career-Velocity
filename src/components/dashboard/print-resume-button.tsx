"use client";

import { Download } from "lucide-react";

export default function PrintResumeButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-brand-500/20"
            title="Download vector PDF"
        >
            <Download className="w-4 h-4" />
            Download PDF
        </button>
    );
}
