// -------------------------------------------------------------
// Invite Acceptance Page - /invite/[token]
// -------------------------------------------------------------
//
// This is the page a user lands on when they click the link
// from an invitation email.
//
// STATES IT HANDLES:
//   1. Invalid token             → "Invalid invitation"
//   2. Already accepted          → "Already accepted"
//   3. Revoked / not PENDING     → "No longer valid"
//   4. Expired                   → "Invitation expired"
//   5. Not logged in             → "Log in to accept"
//   6. Logged in, wrong email    → "Wrong account"
//   7. Logged in, matching email → "Accept invitation" button
//
// WHY IT'S A SERVER COMPONENT:
// We want to render the correct state before any client-side
// JS loads. Reading the session + DB on the server means no
// flash of "loading" state. The only client piece is the
// accept button (small client component).
// -------------------------------------------------------------

import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/tokens';
import AcceptInvitationButton from '@/components/workspace/AcceptInvitationButton';

export default async function InvitePage({ params }) {
  const { token } = await params;

  // ─── Step 1: Look up the invitation ───
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  // ─── Step 2: Invalid token ───
  if (!invitation) {
    return (
      <InviteError
        title="Invalid invitation"
        message="This invitation link doesn't exist or has been removed."
      />
    );
  }

  // ─── Step 3: Not PENDING ───
  if (invitation.status !== 'PENDING') {
    const isAccepted = invitation.status === 'ACCEPTED';
    return (
      <InviteError
        title={isAccepted ? 'Already accepted' : 'Invitation no longer valid'}
        message={
          isAccepted
            ? 'This invitation has already been used. If you joined, you can visit the workspace.'
            : 'This invitation is no longer valid. Ask the workspace owner to send a new one.'
        }
        workspaceId={isAccepted ? invitation.workspace.id : null}
      />
    );
  }

  // ─── Step 4: Expired ───
  if (isTokenExpired(invitation.expiresAt)) {
    // Lazily mark it as EXPIRED for future lookups.
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    return (
      <InviteError
        title="Invitation expired"
        message="This invitation has expired. Ask the workspace owner to send a new one."
      />
    );
  }

  // ─── Step 5: Get session ───
  const session = await getServerSession(authOptions);

  // ─── Step 6: Not logged in ───
  if (!session?.user?.id) {
    return (
      <InviteShell>
        <div className="text-center mb-6">
          <WorkspaceAvatar name={invitation.workspace.name} />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            You&apos;ve been invited
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>{invitation.invitedBy.name || invitation.invitedBy.email}</strong>{' '}
            invited you to join <strong>{invitation.workspace.name}</strong>
          </p>
        </div>

        <div className="p-3 mb-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900">
          <p className="text-xs text-indigo-700 dark:text-indigo-300 text-center">
            Log in or create an account with{' '}
            <strong>{invitation.email}</strong> to accept
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/login?callbackUrl=/invite/${token}`}
            className="block w-full text-center py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Log in
          </Link>
          <Link
            href={`/register?callbackUrl=/invite/${token}`}
            className="block w-full text-center py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Create account
          </Link>
        </div>
      </InviteShell>
    );
  }

  // ─── Step 7: Logged in — email match check ───
  const sessionEmail = (session.user.email || '').toLowerCase().trim();
  const inviteEmail = invitation.email.toLowerCase().trim();

  if (sessionEmail !== inviteEmail) {
    return (
      <InviteError
        title="Wrong account"
        message={`This invitation was sent to ${invitation.email}. You are currently logged in as ${session.user.email}. Log out and sign in with the correct account.`}
        showLogout
      />
    );
  }

  // ─── Step 8: All good — show accept button ───
  return (
    <InviteShell>
      <div className="text-center mb-6">
        <WorkspaceAvatar name={invitation.workspace.name} />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Join {invitation.workspace.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <strong>{invitation.invitedBy.name || invitation.invitedBy.email}</strong>{' '}
          invited you as a <strong>{invitation.role.toLowerCase()}</strong>
        </p>
      </div>

      <AcceptInvitationButton token={token} />
    </InviteShell>
  );
}

// =============================================================
// InviteShell — centered card layout for invite pages
// =============================================================
const InviteShell = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
      {children}
    </div>
  </div>
);

// =============================================================
// WorkspaceAvatar — 2-letter initial tile
// =============================================================
const WorkspaceAvatar = ({ name }) => (
  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
    {name.slice(0, 2).toUpperCase()}
  </div>
);

// =============================================================
// InviteError — friendly error page for invalid/expired links
// =============================================================
const InviteError = ({ title, message, workspaceId, showLogout }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-red-600 dark:text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>

      <div className="flex flex-col gap-3">
        {workspaceId && (
          <Link
            href={`/workspaces/${workspaceId}`}
            className="inline-block px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            Go to workspace
          </Link>
        )}
        {showLogout && (
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            Go to login
          </Link>
        )}
        {!workspaceId && !showLogout && (
          <Link
            href="/workspaces"
            className="inline-block px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            Go to workspaces
          </Link>
        )}
      </div>
    </div>
  </div>
);