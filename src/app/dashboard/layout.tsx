// ============================================================================
// CareerVelocity — Dashboard Layout (Server Component)
// Persistent sidebar + dynamic content area.
// ============================================================================

import Sidebar from "@/components/dashboard/sidebar";

export const metadata = {
    title: "Dashboard | CareerVelocity",
    description: "Manage your career pipeline, tailor resumes, and track applications.",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Persistent Sidebar */}
            <Sidebar />

            {/* Main Content Area — offset by sidebar width */}
            <main className="flex-1 ml-[260px] print:ml-0 p-6 print:p-0 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
