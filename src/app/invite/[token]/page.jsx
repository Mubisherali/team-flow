// -------------------------------------------------------------
// Invite Acceptance Page - /invite/[token]
// -------------------------------------------------------------
//
// WHEN USED:
//   The page a user lands on when they click the link in an
//   invitation email.
//
// STATES HANDLED:
//   1. Invalid token             → "Invalid invitation"
//   2. Already accepted          → "Already accepted"
//   3. Revoked / not PENDING     → "No longer valid"
//   4. Expired                   → "Invitation expired"
//   5. Not logged in             → "Log in to accept"
//   6. Logged in, wrong email    → "Wrong account"
//   7. Logged in, matching email → "Accept invitation" button
//
// WHY A SERVER COMPONENT:
//   Reading the session + DB on the server means the correct
//   state renders before any client JS loads — no flash of
//   "loading". The only client piece is AcceptInvitationButton.
//
// POLISH:
//   - Card surface matches TaskDetailModal (dark #0f1115)
//   - Glass error / info surfaces
//   - Buttons with active:scale + focus rings
//   - Tighter type scale (Wave-3)
//   - WorkspaceAvatar keeps gradient + inner ring (C choice)
//   - A11y: role=alert, aria-hidden on decorative icons
//
// PRESERVED:
//   - All server logic (steps 1-8)
//   - All DB queries + expiry updates
//   - Email match check (case-insensitive)
//   - Sub-component names (InviteShell, WorkspaceAvatar,
//     InviteError) + signatures
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
          <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
            You&apos;ve been invited
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
            <strong className="text-gray-900 dark:text-white font-medium">
              {invitation.invitedBy.name || invitation.invitedBy.email}
            </strong>{' '}
            invited you to join{' '}
            <strong className="text-gray-900 dark:text-white font-medium">
              {invitation.workspace.name}
            </strong>
          </p>
        </div>

        {/* Glass info banner */}
        <div
          className="
            mb-6 rounded-xl px-3.5 py-3
            bg-indigo-500/[0.07] dark:bg-indigo-500/10
            border border-indigo-500/20
          "
        >
          <p className="text-[12px] text-indigo-700 dark:text-indigo-300 text-center leading-relaxed">
            Log in or create an account with{' '}
            <strong className="font-semibold">{invitation.email}</strong> to
            accept
          </p>
        </div>

        <div className="space-y-2.5">
          <Link
            href={`/login?callbackUrl=/invite/${token}`}
            className="
              block w-full text-center
              py-2.5 rounded-xl
              bg-indigo-600 hover:bg-indigo-700
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              text-white text-[13px] font-medium
              transition-all duration-150
            "
          >
            Log in
          </Link>
          <Link
            href={`/register?callbackUrl=/invite/${token}`}
            className="
              block w-full text-center
              py-2.5 rounded-xl
              border border-gray-300 dark:border-white/[0.08]
              text-gray-700 dark:text-gray-300
              text-[13px] font-medium
              hover:bg-gray-50 dark:hover:bg-white/[0.04]
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              transition-all duration-150
            "
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
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
          Join {invitation.workspace.name}
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-900 dark:text-white font-medium">
            {invitation.invitedBy.name || invitation.invitedBy.email}
          </strong>{' '}
          invited you as a{' '}
          <strong className="text-gray-900 dark:text-white font-medium">
            {invitation.role.toLowerCase()}
          </strong>
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
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0d12] p-4">
    <div
      className="
        w-full max-w-md
        bg-white dark:bg-[#0f1115]
        rounded-2xl
        border border-gray-200 dark:border-white/[0.08]
        shadow-2xl shadow-black/5 dark:shadow-black/60
        p-6 sm:p-8
      "
    >
      {children}
    </div>
  </div>
);

// =============================================================
// WorkspaceAvatar — 2-letter initial tile with gradient (C)
// =============================================================
const WorkspaceAvatar = ({ name }) => (
  <div
    className="
      w-14 h-14 mx-auto mb-4 rounded-2xl
      bg-gradient-to-br from-indigo-500 to-purple-600
      flex items-center justify-center
      text-white font-bold text-lg
      shadow-lg shadow-indigo-500/20
      ring-1 ring-inset ring-white/20
    "
    aria-hidden="true"
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

// =============================================================
// InviteError — friendly error page for invalid/expired links
// =============================================================
const InviteError = ({ title, message, workspaceId, showLogout }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0d12] p-4">
    <div
      role="alert"
      className="
        w-full max-w-md text-center
        bg-white dark:bg-[#0f1115]
        rounded-2xl
        border border-gray-200 dark:border-white/[0.08]
        shadow-2xl shadow-black/5 dark:shadow-black/60
        p-6 sm:p-8
      "
    >
      {/* Error icon */}
      <div
        className="
          w-14 h-14 mx-auto mb-4 rounded-full
          bg-red-500/10 dark:bg-red-500/15
          flex items-center justify-center
        "
        aria-hidden="true"
      >
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

      <h1 className="text-[16px] font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
        {title}
      </h1>
      <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col gap-2.5">
        {workspaceId && (
          <Link
            href={`/workspaces/${workspaceId}`}
            className="
              inline-block px-5 py-2.5 rounded-xl
              bg-indigo-600 hover:bg-indigo-700
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              text-white text-[13px] font-medium
              transition-all duration-150
            "
          >
            Go to workspace
          </Link>
        )}
        {showLogout && (
          <Link
            href="/login"
            className="
              inline-block px-5 py-2.5 rounded-xl
              border border-gray-300 dark:border-white/[0.08]
              text-gray-700 dark:text-gray-300
              text-[13px] font-medium
              hover:bg-gray-50 dark:hover:bg-white/[0.04]
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              transition-all duration-150
            "
          >
            Go to login
          </Link>
        )}
        {!workspaceId && !showLogout && (
          <Link
            href="/workspaces"
            className="
              inline-block px-5 py-2.5 rounded-xl
              border border-gray-300 dark:border-white/[0.08]
              text-gray-700 dark:text-gray-300
              text-[13px] font-medium
              hover:bg-gray-50 dark:hover:bg-white/[0.04]
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              transition-all duration-150
            "
          >
            Go to workspaces
          </Link>
        )}
      </div>
    </div>
  </div>
);