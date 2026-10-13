// -------------------------------------------------------------
// Members Page - /workspaces/[id]/members
// -------------------------------------------------------------
//
// URL: /workspaces/:id/members
//
// SERVER COMPONENT:
//   - Auth check
//   - Verify user is a member of the workspace
//   - Fetch workspace + members + pending invitations
//   - Render client components for interactivity
//
// DATA FLOW:
//   page.jsx (server)
//     ├─ fetch workspace
//     ├─ fetch members (sorted by role priority)
//     ├─ fetch pending invitations (only if owner/manager)
//     └─ render:
//         ├─ <MembersListClient>
//         └─ <PendingInvitationsList>
//
// POLISH:
//   - Tighter type scale (Wave-3)
//   - Back link + focus ring
//   - Section landmarks (aria-labelledby)
//   - A11y: aria-hidden on decorative SVGs
//
// PRESERVED:
//   - Same server logic (auth → membership → fetch)
//   - Role-weighted member sort + join-date tiebreak
//   - Pending invitations fetched only for owner/manager
//   - Invite link building server-side
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canInviteMembers,
} from '@/lib/permissions';
import MembersListClient from '@/components/workspace/MembersListClient';
import PendingInvitationsList from '@/components/workspace/PendingInvitationsList';

export default async function MembersPage({ params }) {
  // ─── Step 1: Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id: workspaceId } = await params;

  // ─── Step 2: Must be a member to view ───
  const role = await getMemberRole(session.user.id, workspaceId);
  if (!canViewWorkspace(role)) {
    notFound();
  }

  // ─── Step 3: Fetch workspace (need name for header) ───
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, slug: true },
  });

  if (!workspace) {
    notFound();
  }

  // ─── Step 4: Fetch members with user info ───
  const memberships = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Sort: OWNER first, then MANAGER, then MEMBER. Within
  // the same role, oldest member first.
  const roleWeight = { OWNER: 0, MANAGER: 1, MEMBER: 2 };

  const shapedMembers = [...memberships]
    .sort((a, b) => {
      const roleDiff = roleWeight[a.role] - roleWeight[b.role];
      if (roleDiff !== 0) return roleDiff;
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    })
    .map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }));

  // ─── Step 5: Pending invitations (owner/manager only) ───
  let pendingInvitations = [];

  if (canInviteMembers(role)) {
    const invites = await prisma.invitation.findMany({
      where: { workspaceId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    // Build invite links for the copy button.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = appUrl.replace(/\/$/, '');

    pendingInvitations = invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      inviteLink: `${baseUrl}/invite/${inv.token}`,
    }));
  }

  // ─── Step 6: Render ───
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* ══════════ BACK LINK ══════════ */}
      <Link
        href={`/workspaces/${workspaceId}`}
        className="
          inline-flex items-center gap-1.5 mb-6
          text-[13px] font-medium
          text-gray-600 dark:text-gray-400
          hover:text-gray-900 dark:hover:text-white
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          rounded
          transition-colors duration-150
        "
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to workspace
      </Link>

      {/* ══════════ HEADER ══════════ */}
      <header className="mb-8">
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          Team
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          {workspace.name} ·{' '}
          <span className="font-mono text-[12.5px]">/{workspace.slug}</span>
        </p>
      </header>

      {/* ══════════ MEMBERS ══════════ */}
      <section aria-label="Members" className="mb-10">
        <MembersListClient
          workspaceId={workspaceId}
          currentUserId={session.user.id}
          currentUserRole={role}
          initialMembers={shapedMembers}
        />
      </section>

      {/* ══════════ PENDING INVITATIONS ══════════ */}
      {canInviteMembers(role) && (
        <section aria-labelledby="pending-invites-heading">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2
              id="pending-invites-heading"
              className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Pending invitations
            </h2>
            <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
              {pendingInvitations.length} pending
            </span>
          </div>
          <PendingInvitationsList
            workspaceId={workspaceId}
            invitations={pendingInvitations}
          />
        </section>
      )}
    </div>
  );
}