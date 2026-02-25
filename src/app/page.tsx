// ============================================================================
// CareerVelocity — Landing Page
// Premium marketing page showcasing the platform's capabilities.
// ============================================================================

import Link from "next/link";
import {
  Zap,
  FileSearch,
  Brain,
  Shield,
  ArrowRight,
  CheckCircle2,
  Chrome,
  Sparkles,
} from "lucide-react";

import { PricingButton } from "@/components/landing/pricing-button";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Resume Tailoring",
    description:
      "GPT-4o rewrites your resume for every job using ATS-safe keywords — never fabricating experience.",
    gradient: "from-brand-500 to-accent-cyan",
  },
  {
    icon: FileSearch,
    title: "ATS-Safe PDF Export",
    description:
      "Single-column, Helvetica-only PDFs engineered to pass Workday, Greenhouse, and every major ATS.",
    gradient: "from-accent-cyan to-accent-emerald",
  },
  {
    icon: Chrome,
    title: "Browser Extension",
    description:
      "One-click optimization on LinkedIn & Indeed. No context switching — results appear in a sidebar overlay.",
    gradient: "from-accent-emerald to-brand-400",
  },
  {
    icon: Shield,
    title: "Application Tracker",
    description:
      "Drag-and-drop Kanban board to track every application from Saved to Offer. Never lose track again.",
    gradient: "from-brand-400 to-accent-rose",
  },
];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 AI tailorings/month", "Basic ATS scoring", "Application tracker"],
    cta: "Get Started",
    highlighted: false,
    priceId: undefined,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "50 AI tailorings/month",
      "Cover letter generation",
      "ATS-safe PDF export",
      "Browser extension",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
  },
  {
    name: "Pro Annual",
    price: "$99",
    period: "/6 months",
    features: [
      "100 AI tailorings/month",
      "Everything in Pro",
      "Interview question bank",
      "Resume analytics",
      "GDPR data export",
    ],
    cta: "Best Value",
    highlighted: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight gradient-brand-text">
              CareerVelocity
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-xl text-sm font-semibold gradient-brand text-white
                         hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium text-brand-300">
            <Sparkles className="w-4 h-4" />
            AI-Powered Career Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
            <span className="text-text-primary">Land interviews,</span>
            <br />
            <span className="gradient-brand-text">not rejections.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            CareerVelocity uses GPT-4o to tailor your resume for every application,
            generate ATS-safe PDFs, and track your pipeline — all from one dashboard
            or directly on LinkedIn.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold
                         gradient-brand text-white hover:opacity-90 transition-all
                         shadow-lg shadow-brand-500/25"
            >
              Start Free — No Card Required
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 pt-6 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
              3x more interviews
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
              92% ATS pass rate
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
              Zero fabricated data
            </span>
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-text-primary mb-4">
            Everything you need to land your next role
          </h2>
          <p className="text-center text-text-muted mb-12 max-w-lg mx-auto">
            One platform replaces 5 separate tools. No more spreadsheets, no more guessing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group glass rounded-2xl p-6 hover:border-brand-500/25 transition-all duration-200"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4
                              group-hover:shadow-lg group-hover:shadow-brand-500/20 transition-shadow`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-text-primary mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-text-muted mb-12">
            Start free. Upgrade when you&apos;re ready to go all-in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 flex flex-col ${tier.highlighted
                  ? "gradient-brand text-white ring-2 ring-brand-400/50 shadow-2xl shadow-brand-500/20"
                  : "glass"
                  }`}
              >
                <h3
                  className={`text-lg font-bold mb-1 ${tier.highlighted ? "text-white" : "text-text-primary"
                    }`}
                >
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className={`text-4xl font-extrabold ${tier.highlighted ? "text-white" : "text-text-primary"
                      }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm ${tier.highlighted ? "text-white/70" : "text-text-muted"
                      }`}
                  >
                    {tier.period}
                  </span>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-2 text-sm ${tier.highlighted ? "text-white/90" : "text-text-secondary"
                        }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${tier.highlighted ? "text-white" : "text-accent-emerald"
                          }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <PricingButton
                  tierName={tier.name}
                  cta={tier.cta}
                  highlighted={tier.highlighted}
                  priceId={tier.priceId}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-text-muted">
              © 2026 CareerVelocity. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-text-muted">
            <span className="hover:text-text-secondary cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-text-secondary cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-text-secondary cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
