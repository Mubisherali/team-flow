// ─────────────────────────────────────────────────────────────
// Prisma Client Singleton
// ─────────────────────────────────────────────────────────────
//
// WHY THIS FILE EXISTS:
// Next.js in development mode uses "hot reload" — every time you
// save a file, the server restarts. If we just did `new PrismaClient()`
// at the top of every API route, each hot reload would open a NEW
// database connection. After 10-20 saves, you'd hit Postgres's
// connection limit and the app would crash.
//
// THE FIX:
// We store the Prisma client on `globalThis`, which survives hot
// reloads. On first load we create the client; on every subsequent
// reload we reuse the existing one. In production (no hot reload),
// we just create a single client normally.
//
// USAGE:
//   import { prisma } from '@/lib/prisma';
//   const users = await prisma.user.findMany();
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

// `globalThis` is a global object available everywhere in Node.
// We attach Prisma to it so it survives hot reloads.
const globalForPrisma = globalThis;

// Reuse the existing client if it exists, otherwise create a new one.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // In dev: log queries + errors + warnings (helps you debug)
    // In prod: only log errors (keep logs clean)
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Only attach to globalThis in non-production.
// In production, we don't need the hot-reload protection.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}