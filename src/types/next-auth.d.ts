import { type DefaultSession } from "next-auth";

// ---------------------------------------------------------------------------
// NextAuth Type Extensions
// Extends the default Session & JWT types to include CareerVelocity fields.
// ---------------------------------------------------------------------------

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            subscriptionStatus: string;
            aiQuotaLimit: number;
            aiQuotaUsed: number;
            stripeCustomerId: string | null;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        subscriptionStatus?: string;
        aiQuotaLimit?: number;
        aiQuotaUsed?: number;
        stripeCustomerId?: string | null;
    }
}
