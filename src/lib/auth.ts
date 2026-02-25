import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import EmailProvider from "next-auth/providers/email";
import prisma from "@/lib/prisma";

// ---------------------------------------------------------------------------
// NextAuth Configuration
// Providers: Google OAuth, LinkedIn OAuth, Magic Link (Email)
// Adapter:   Prisma (PostgreSQL / Supabase)
// Strategy:  JWT (stateless, edge-compatible)
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

    providers: [
        // ── Google OAuth ────────────────────────────────────────────────────
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),

        // ── LinkedIn OAuth (optional — only if credentials are configured) ──
        ...(process.env.LINKEDIN_CLIENT_ID
            ? [
                LinkedInProvider({
                    clientId: process.env.LINKEDIN_CLIENT_ID!,
                    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
                    allowDangerousEmailAccountLinking: true,
                }),
            ]
            : []),

        // ── Magic Link Email (optional — only if SMTP is configured) ────────
        ...(process.env.SMTP_HOST
            ? [
                EmailProvider({
                    server: {
                        host: process.env.SMTP_HOST,
                        port: Number(process.env.SMTP_PORT ?? 587),
                        secure: process.env.SMTP_PORT === "465",
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASSWORD,
                        },
                    },
                    from:
                        process.env.EMAIL_FROM ??
                        "CareerVelocity <noreply@careervelocity.app>",
                }),
            ]
            : []),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: "/auth/signin",
        verifyRequest: "/auth/verify-request",
        error: "/auth/error",
    },

    callbacks: {
        // Attach user ID and subscription info to the JWT token
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }

            // Hydrate subscription data on every token refresh
            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: {
                        subscriptionStatus: true,
                        aiQuotaLimit: true,
                        aiQuotaUsed: true,
                        stripeCustomerId: true,
                    },
                });

                if (dbUser) {
                    token.subscriptionStatus = dbUser.subscriptionStatus;
                    token.aiQuotaLimit = dbUser.aiQuotaLimit;
                    token.aiQuotaUsed = dbUser.aiQuotaUsed;
                    token.stripeCustomerId = dbUser.stripeCustomerId;
                }
            }

            return token;
        },

        // Expose user ID and subscription info in client-side session
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.subscriptionStatus = token.subscriptionStatus as string;
                session.user.aiQuotaLimit = token.aiQuotaLimit as number;
                session.user.aiQuotaUsed = token.aiQuotaUsed as number;
                session.user.stripeCustomerId = token.stripeCustomerId as string | null;
            }
            return session;
        },
    },

    events: {
        // Sync OAuth profile IDs to our User model on first link
        async linkAccount({ user, account }) {
            if (account.provider === "google") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: account.providerAccountId },
                });
            }
            if (account.provider === "linkedin") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { linkedinId: account.providerAccountId },
                });
            }
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};
