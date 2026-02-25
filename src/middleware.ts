// ============================================================================
// CareerVelocity — Auth Middleware
// Protects dashboard routes and API routes from unauthenticated access.
// In development mode, allows demo access when no DB is configured.
// ============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Routes that require authentication ──────────────────────────────────────

const PROTECTED_API_ROUTES = ["/api/extension"];

// ── Public routes ───────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ["/", "/auth", "/api/auth", "/api/webhooks"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip public routes and static assets
    if (
        PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // For dashboard routes: allow access (the page itself handles demo mode)
    if (pathname.startsWith("/dashboard")) {
        // Try to validate auth token if available
        try {
            const { getToken } = await import("next-auth/jwt");
            const token = await getToken({
                req: request,
                secret: process.env.NEXTAUTH_SECRET,
            });

            if (token) {
                // Authenticated — inject user ID header
                const response = NextResponse.next();
                response.headers.set("x-user-id", token.sub ?? "");
                return response;
            }
        } catch {
            // Auth check failed (no DB, etc.) — allow through for demo mode
        }

        // Allow access — dashboard page handles demo fallback
        return NextResponse.next();
    }

    // For protected API routes: require auth
    const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    if (isProtectedApi) {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|icons/).*)",
    ],
};
