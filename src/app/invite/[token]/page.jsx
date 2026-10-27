// -------------------------------------------------------------
// Invite Acceptance Page — /invite/[token]
// Premium TeamFlow invitation experience
// -------------------------------------------------------------

import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/tokens";
import AcceptInvitationButton from "@/components/workspace/AcceptInvitationButton";

// -------------------------------------------------------------
// Page
// -------------------------------------------------------------
export default async function InvitePage({ params }) {
  const { token } = await params;

  // Step 1: Find invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Step 2: Invalid token
  if (!invitation) {
    return (
      <InviteError
        title="Invalid invitation"
        message="This invitation link doesn't exist or may have been removed. Ask the workspace owner for a fresh invitation."
        kind="invalid"
      />
    );
  }

  // Step 3: Invitation is no longer pending
  if (invitation.status !== "PENDING") {
    const isAccepted = invitation.status === "ACCEPTED";

    return (
      <InviteError
        title={isAccepted ? "Already accepted" : "Invitation unavailable"}
        message={
          isAccepted
            ? "This invitation has already been used. If you joined the workspace, you can continue to it below."
            : "This invitation is no longer active. Ask the workspace owner to send you a new one."
        }
        workspaceId={isAccepted ? invitation.workspace.id : null}
        kind={isAccepted ? "accepted" : "invalid"}
      />
    );
  }

  // Step 4: Expired invitation
  if (isTokenExpired(invitation.expiresAt)) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });

    return (
      <InviteError
        title="Invitation expired"
        message="This invitation has reached its expiry date. Contact the workspace owner to request a new link."
        kind="expired"
      />
    );
  }

  // Step 5: Get session
  const session = await getServerSession(authOptions);

  // Step 6: User must log in
  if (!session?.user?.id) {
    return (
      <InviteShell>
        <InviteEyebrow>Workspace invitation</InviteEyebrow>

        <div className="mb-7 text-center">
          <WorkspaceAvatar name={invitation.workspace.name} />

          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[28px]">
            You&apos;re invited
            <span className="text-indigo-400">.</span>
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-400">
            <strong className="font-medium text-gray-100">
              {invitation.invitedBy.name || invitation.invitedBy.email}
            </strong>{" "}
            invited you to collaborate in{" "}
            <strong className="font-medium text-gray-100">
              {invitation.workspace.name}
            </strong>
            .
          </p>
        </div>

        <WorkspaceSummary
          workspaceName={invitation.workspace.name}
          invitedBy={invitation.invitedBy.name || invitation.invitedBy.email}
          role={invitation.role}
        />

        <InfoBanner>
          Sign in or create an account using{" "}
          <strong className="break-all font-semibold text-indigo-200">
            {invitation.email}
          </strong>
          . The invitation is linked to this email address.
        </InfoBanner>

        <div className="space-y-3">
          <PrimaryLink href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
            Log in to accept
            <ArrowIcon />
          </PrimaryLink>

          <SecondaryLink href={`/register?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
            Create an account
          </SecondaryLink>
        </div>

        <SecurityNote>
          Only continue if you recognize the person or team that invited you.
        </SecurityNote>
      </InviteShell>
    );
  }

  // Step 7: Verify email
  const sessionEmail = (session.user.email || "").toLowerCase().trim();
  const inviteEmail = invitation.email.toLowerCase().trim();

  if (!sessionEmail || sessionEmail !== inviteEmail) {
    return (
      <InviteError
        title="Wrong account"
        message={`This invitation was sent to ${invitation.email}, but you are signed in as ${session.user.email || "an account without a verified email address"}. Sign in with the invited email address to continue.`}
        showLogout
        kind="account"
      />
    );
  }

  // Step 8: Correct account — show accept action
  return (
    <InviteShell>
      <InviteEyebrow>Workspace invitation</InviteEyebrow>

      <div className="mb-7 text-center">
        <WorkspaceAvatar name={invitation.workspace.name} />

        <div className="mb-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Invitation ready
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[28px]">
          Join {invitation.workspace.name}
          <span className="text-indigo-400">.</span>
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-400">
          <strong className="font-medium text-gray-100">
            {invitation.invitedBy.name || invitation.invitedBy.email}
          </strong>{" "}
          invited you to join their team on TeamFlow.
        </p>
      </div>

      <WorkspaceSummary
        workspaceName={invitation.workspace.name}
        invitedBy={invitation.invitedBy.name || invitation.invitedBy.email}
        role={invitation.role}
      />

      <div className="mb-5 rounded-xl border border-indigo-400/15 bg-indigo-400/[0.045] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300">
            <CheckIcon />
          </div>

          <div>
            <p className="text-[13px] font-medium text-gray-100">
              You&apos;re using the right account
            </p>
            <p className="mt-1 break-all text-xs leading-5 text-gray-400">
              {sessionEmail}
            </p>
          </div>
        </div>
      </div>

      <AcceptInvitationButton token={token} />

      <SecurityNote>
        By accepting, you&apos;ll join this workspace with the role shown above.
      </SecurityNote>
    </InviteShell>
  );
}

// -------------------------------------------------------------
// InviteShell — centered premium card
// -------------------------------------------------------------
function InviteShell({ children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090a0d] px-4 py-10 text-gray-100 selection:bg-indigo-500/30 sm:px-6">
      <BackgroundEffects />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[11px] font-bold tracking-tight text-white shadow-lg shadow-black/20">
            TF
          </div>

          <span className="text-sm font-semibold tracking-[-0.03em] text-gray-200">
            TeamFlow
          </span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0f1115]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
          />

          {children}
        </div>

        <p className="mt-5 text-center text-[10px] tracking-wide text-gray-600">
          COLLABORATE BETTER · BUILD TOGETHER
        </p>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// Background effects
// -------------------------------------------------------------
function BackgroundEffects() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at center, black 10%, transparent 75%)",
        }}
      />

      <div className="absolute -left-32 top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-indigo-600/[0.13] blur-[120px]" />
      <div className="absolute -right-32 bottom-[-8rem] h-[26rem] w-[26rem] rounded-full bg-violet-600/[0.10] blur-[130px]" />
      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.025]" />
      <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.025]" />
    </div>
  );
}

// -------------------------------------------------------------
// Eyebrow
// -------------------------------------------------------------
function InviteEyebrow({ children }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
      <span className="h-px w-5 bg-indigo-400/50" />
      {children}
      <span className="h-px w-5 bg-indigo-400/50" />
    </div>
  );
}

// -------------------------------------------------------------
// Workspace avatar
// -------------------------------------------------------------
function WorkspaceAvatar({ name = "" }) {
  const initials =
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "TF";

  return (
    <div className="relative mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[25px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-xl shadow-indigo-950/50 ring-1 ring-inset ring-white/20">
      <div
        aria-hidden="true"
        className="absolute inset-[5px] rounded-[20px] border border-white/15"
      />

      <span className="relative text-2xl font-bold tracking-[-0.06em] text-white">
        {initials}
      </span>

      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-[#0f1115] bg-emerald-400 text-[#052e20]"
      >
        <CheckIcon />
      </span>
    </div>
  );
}

// -------------------------------------------------------------
// Workspace summary
// -------------------------------------------------------------
function WorkspaceSummary({ workspaceName, invitedBy, role }) {
  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-gray-300">
          <WorkspaceIcon />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-gray-100">
            {workspaceName}
          </p>
          <p className="mt-1 truncate text-[11px] text-gray-500">
            Invited by {invitedBy}
          </p>
        </div>
      </div>

      <div className="my-4 h-px bg-white/[0.07]" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">Your workspace role</span>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/15 bg-indigo-400/[0.08] px-2.5 py-1.5 text-[11px] font-medium capitalize text-indigo-200">
          <RoleIcon />
          {String(role).toLowerCase()}
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Info banner
// -------------------------------------------------------------
function InfoBanner({ children }) {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-indigo-400/15 bg-indigo-400/[0.06] px-3.5 py-3">
      <span className="mt-0.5 shrink-0 text-indigo-300">
        <InfoIcon />
      </span>
      <p className="text-[12px] leading-5 text-gray-300">{children}</p>
    </div>
  );
}

// -------------------------------------------------------------
// Error page
// -------------------------------------------------------------
function InviteError({
  title,
  message,
  workspaceId,
  showLogout = false,
  kind = "invalid",
}) {
  const isAccepted = kind === "accepted";
  const isExpired = kind === "expired";
  const isAccount = kind === "account";

  const iconColor = isAccepted
    ? "text-emerald-300"
    : isAccount
      ? "text-amber-300"
      : "text-rose-300";

  const iconBackground = isAccepted
    ? "border-emerald-400/15 bg-emerald-400/[0.08]"
    : isAccount
      ? "border-amber-400/15 bg-amber-400/[0.08]"
      : "border-rose-400/15 bg-rose-400/[0.08]";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090a0d] px-4 py-10 text-gray-100">
      <BackgroundEffects />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[11px] font-bold text-white">
            TF
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-200">
            TeamFlow
          </span>
        </div>

        <section
          role="alert"
          className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0f1115]/95 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />

          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border ${iconBackground} ${iconColor}`}
            aria-hidden="true"
          >
            {isAccepted ? (
              <CheckIcon size={27} />
            ) : isExpired ? (
              <ClockIcon />
            ) : isAccount ? (
              <UserIcon />
            ) : (
              <AlertIcon />
            )}
          </div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            {isAccepted
              ? "Already completed"
              : isExpired
                ? "Link expired"
                : isAccount
                  ? "Account verification"
                  : "Invitation unavailable"}
          </p>

          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            {title}
            <span className="text-indigo-400">.</span>
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-6 text-gray-400">
            {message}
          </p>

          <div className="mt-7 space-y-3">
            {workspaceId && (
              <PrimaryLink href={`/workspaces/${workspaceId}`}>
                Go to workspace
                <ArrowIcon />
              </PrimaryLink>
            )}

            {showLogout && (
              <PrimaryLink href="/login">
                Go to login
                <ArrowIcon />
              </PrimaryLink>
            )}

            {!workspaceId && !showLogout && (
              <SecondaryLink href="/workspaces">
                Go to workspaces
              </SecondaryLink>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-[10px] tracking-wide text-gray-600">
          TEAMWORK STARTS WITH THE RIGHT CONNECTION
        </p>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// Shared links
// -------------------------------------------------------------
function PrimaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[13px] font-semibold text-white shadow-lg shadow-indigo-950/30 transition duration-200 hover:bg-indigo-500 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115]"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-3 text-[13px] font-medium text-gray-300 transition duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115]"
    >
      {children}
    </Link>
  );
}

// -------------------------------------------------------------
// Security note
// -------------------------------------------------------------
function SecurityNote({ children }) {
  return (
    <p className="mt-5 flex items-start justify-center gap-2 text-center text-[10px] leading-5 text-gray-600">
      <span className="mt-0.5 shrink-0">
        <LockIcon />
      </span>
      <span>{children}</span>
    </p>
  );
}

// -------------------------------------------------------------
// Inline SVG icons — no icon package required
// -------------------------------------------------------------
function CheckIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9 4v16M9 9h12" />
    </svg>
  );
}

function RoleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
