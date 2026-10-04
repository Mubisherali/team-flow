// -------------------------------------------------------------
// Dashboard Layout - Sidebar shell for all post-login pages
// -------------------------------------------------------------
//
// ROUTE GROUP: (dashboard)
// The parentheses mean this folder doesn't appear in the URL.
// Files inside inherit this layout automatically.
//
// WHY IT'S A SERVER COMPONENT (no 'use client'):
// We only need to:
//   - Read the session (getServerSession)
//   - Fetch workspaces (Prisma)
//   - Render HTML
// No client interactivity needed for the SHELL. Interactive
// bits (dropdowns, mobile menu) will be small client
// components we add later.
//
// AUTHENTICATION:
// We double-check the session here. Even though proxy.js
// already redirects unauthenticated users, layout-level checks
// add a second layer of safety (defense in depth).
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }) {
  // ─── Step 1: Auth check (second layer) ───
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // ─── Step 2: Fetch the user's workspaces ───
  // Same query as /api/workspaces GET, but server-side.
  // Sidebar needs this for the workspace list.
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
  }));

  // ─── Step 3: Render shell + sidebar ───
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar (client component — has interactions) */}
      <Sidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        workspaces={workspaces}
      />

      {/* Main content area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}