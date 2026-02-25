// ============================================================================
// CareerVelocity — Dashboard Page (Server Component)
// Fetches user data, stats, and recent applications; renders dashboard widgets.
// Falls back to demo data when no database/session is available.
// ============================================================================

import DashboardHeader from "@/components/dashboard/header";
import StatsOverview from "@/components/dashboard/stats-overview";
import RapidActionClient from "@/components/dashboard/rapid-action-client";
import RecentActivityTable from "@/components/dashboard/recent-activity-table";

// ── Demo Data (shown when DB is unavailable) ────────────────────────────────

const DEMO_USER = {
    name: "Alex Chen",
    subscriptionStatus: "PRO_1M" as const,
    aiQuotaUsed: 12,
    aiQuotaLimit: 50,
};

const DEMO_STATS = {
    totalApplications: 24,
    activeInterviews: 3,
    successRate: 38,
};

const DEMO_RESUMES = [
    { id: "demo-1", title: "Software Engineer — Full Stack" },
    { id: "demo-2", title: "Frontend Developer — React" },
];

const DEMO_RECENT = [
    {
        id: "1",
        companyName: "Stripe",
        jobTitle: "Senior Frontend Engineer",
        status: "INTERVIEW",
        applicationDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        jobUrl: "https://stripe.com/jobs",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
        id: "2",
        companyName: "Vercel",
        jobTitle: "Software Engineer, Platform",
        status: "APPLIED",
        applicationDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        jobUrl: "https://vercel.com/careers",
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
        id: "3",
        companyName: "Linear",
        jobTitle: "Full Stack Engineer",
        status: "OFFER",
        applicationDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        jobUrl: null,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
        id: "4",
        companyName: "Notion",
        jobTitle: "Product Engineer",
        status: "TAILORING",
        applicationDate: null,
        jobUrl: "https://notion.so/careers",
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
        id: "5",
        companyName: "Figma",
        jobTitle: "Design Engineer",
        status: "SAVED",
        applicationDate: null,
        jobUrl: null,
        createdAt: new Date().toISOString(),
    },
];

// ── Data Fetching (with DB fallback) ────────────────────────────────────────

async function getDashboardData() {
    try {
        // Try to load auth + prisma dynamically to avoid build errors when DB unavailable
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/lib/auth");
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return null; // No session → use demo data
        }

        const prisma = (await import("@/lib/prisma")).default;
        const [user, applications, baseResumes] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    name: true,
                    subscriptionStatus: true,
                    aiQuotaUsed: true,
                    aiQuotaLimit: true,
                },
            }),
            prisma.jobApplication.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    companyName: true,
                    jobTitle: true,
                    status: true,
                    applicationDate: true,
                    jobUrl: true,
                    createdAt: true,
                },
            }),
            prisma.baseResume.findMany({
                where: { userId: session.user.id },
                orderBy: { updatedAt: "desc" },
                select: { id: true, title: true },
            }),
        ]);

        if (!user) return null;

        const totalApplications = applications.length;
        const activeInterviews = applications.filter(
            (a: any) => a.status === "INTERVIEW"
        ).length;
        const appliedOrBeyond = applications.filter((a: any) =>
            ["APPLIED", "INTERVIEW", "OFFER"].includes(a.status)
        ).length;
        const interviewsOrOffers = applications.filter((a: any) =>
            ["INTERVIEW", "OFFER"].includes(a.status)
        ).length;
        const successRate =
            appliedOrBeyond > 0
                ? Math.round((interviewsOrOffers / appliedOrBeyond) * 100)
                : 0;

        return {
            user,
            stats: { totalApplications, activeInterviews, successRate },
            recentApplications: applications.slice(0, 5).map((a: any) => ({
                ...a,
                applicationDate: a.applicationDate?.toISOString() ?? null,
                createdAt: a.createdAt.toISOString(),
            })),
            baseResumes,
            userId: session.user.id,
        };
    } catch {
        // DB connection failed → fall back to demo
        return null;
    }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const data = await getDashboardData();

    // Use real data or demo fallback
    const user = data?.user ?? DEMO_USER;
    const stats = data?.stats ?? DEMO_STATS;
    const recent = data?.recentApplications ?? DEMO_RECENT;
    const resumes = data?.baseResumes ?? DEMO_RESUMES;
    const userId = data?.userId ?? "demo-user";

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Demo Banner */}
            {!data && (
                <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 border-brand-500/20">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-300">
                        DEMO
                    </span>
                    <p className="text-sm text-text-secondary">
                        Viewing with sample data. Connect a database and sign in to see your real dashboard.
                    </p>
                </div>
            )}

            {/* ── Header ────────────────────────────────────────────────────── */}
            <DashboardHeader
                userName={user.name}
                subscriptionStatus={user.subscriptionStatus}
                aiQuotaUsed={user.aiQuotaUsed}
                aiQuotaLimit={user.aiQuotaLimit}
            />

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <StatsOverview
                totalApplications={stats.totalApplications}
                activeInterviews={stats.activeInterviews}
                successRate={stats.successRate}
            />

            {/* ── Rapid Action Module ───────────────────────────────────────── */}
            <RapidActionClient baseResumes={resumes} userId={userId} />

            {/* ── Recent Activity ───────────────────────────────────────────── */}
            <RecentActivityTable applications={recent} />
        </div>
    );
}
