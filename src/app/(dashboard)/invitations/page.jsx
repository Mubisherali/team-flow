// -------------------------------------------------------------
// Invitations Page - /invitations
// -------------------------------------------------------------
//
// URL: /invitations
//
// SERVER COMPONENT:
//   - Auth check
//   - Fetch pending invitations for the current user's email
//   - Render header + <InvitationsList />
//
// WHY SERVER-RENDERED:
//   Same reason as the other dashboard pages — no loading
//   flash. The client <InvitationsList /> handles the
//   interactivity (accept / decline).
//
// POLISH:
//   - Type scale matches Wave-3 (17/13/12.5)
//   - Section landmark
//   - Empty state handled by InvitationsList
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/tokens';
import InvitationsList from '@/components/invitations/InvitationsList';

export const metadata = {
  title: 'Invitations · TeamFlow',
};

export default async function InvitationsPage() {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    redirect('/login');
  }

  const userEmail = session.user.email.toLowerCase().trim();

  // ─── Fetch pending invitations for this email ───
  const invitations = await prisma.invitation.findMany({
    where: {
      email: userEmail,
      status: 'PENDING',
    },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
      invitedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ─── Lazily expire any past-due invites ───
  const now = Date.now();
  const expired = [];
  const live = [];

  for (const inv of invitations) {
    if (isTokenExpired(inv.expiresAt)) {
      expired.push(inv.id);
    } else {
      live.push(inv);
    }
  }

  if (expired.length > 0) {
    try {
      await prisma.invitation.updateMany({
        where: { id: { in: expired } },
        data: { status: 'EXPIRED' },
      });
    } catch (err) {
      console.error('[INVITATIONS_PAGE_EXPIRE]', err);
    }
  }

  // ─── Shape for the client ───
  const shaped = live.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    token: inv.token,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    workspace: inv.workspace,
    invitedBy: inv.invitedBy,
  }));

  // ─── Render ───
  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          Invitations
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          Pending workspace invitations waiting for your response.
        </p>
      </header>

      <section aria-label="Pending invitations">
        <InvitationsList initialInvitations={shaped} />
      </section>
    </div>
  );
}