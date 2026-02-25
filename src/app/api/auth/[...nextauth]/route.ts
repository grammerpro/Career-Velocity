import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------------------------------------------------------------------------
// NextAuth.js Route Handler (App Router)
// Handles all /api/auth/* routes: signin, signout, callback, session, etc.
// ---------------------------------------------------------------------------

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
