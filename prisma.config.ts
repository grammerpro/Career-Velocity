// CareerVelocity — Prisma Configuration
// Prisma 7.x: datasource URL must be configured here, NOT in schema.prisma.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for schema push/migrations (bypasses pgBouncer which doesn't
    // support prepared statements needed by Prisma's migration engine).
    // Falls back to DATABASE_URL for runtime queries via the connection pooler.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
