
// -------------------------------------------------------------
// Invitations Page — /invitations
// Premium server-rendered invitations dashboard
// -------------------------------------------------------------

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/tokens";
import InvitationsList from "@/components/invitations/InvitationsList";

export const metadata = {
  title: "Invitations · TeamFlow",
};

export default async function InvitationsPage() {
  // -----------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const userEmail = session.user.email.toLowerCase().trim();

  // -----------------------------------------------------------
  // Fetch invitations for the current user's email
  // -----------------------------------------------------------
  const invitations = await prisma.invitation.findMany({
    where: {
      email: userEmail,
      status: "PENDING",
    },
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
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // -----------------------------------------------------------
  // Lazily expire past-due invitations
  // -----------------------------------------------------------
  const expiredIds = [];
  const liveInvitations = [];

  for (const invitation of invitations) {
    if (isTokenExpired(invitation.expiresAt)) {
      expiredIds.push(invitation.id);
    } else {
      liveInvitations.push(invitation);
    }
  }

  if (expiredIds.length > 0) {
    try {
      await prisma.invitation.updateMany({
        where: {
          id: {
            in: expiredIds,
          },
        },
        data: {
          status: "EXPIRED",
        },
      });
    } catch (error) {
      console.error("[INVITATIONS_PAGE_EXPIRE]", error);
    }
  }

  // -----------------------------------------------------------
  // Serialize data for the client component
  // -----------------------------------------------------------
  const shapedInvitations = liveInvitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    token: invitation.token,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    workspace: invitation.workspace,
    invitedBy: invitation.invitedBy,
  }));

  const invitationCount = shapedInvitations.length;

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  return (
    <main className="relative mx-auto min-h-full w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[min(90%,760px)] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-[110px]"
      />

      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <div className="mb-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          TeamFlow / Workspace access
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-gray-950 dark:text-white sm:text-4xl">
              Invitations
              <span className="text-indigo-500 dark:text-indigo-400">.</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-[14px]">
              Your next collaboration could start here. Review your workspace
              invitations and choose where you want to work together.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 shadow-sm shadow-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.025] dark:shadow-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
                <path d="M16 3v4M8 3v4" />
              </svg>
            </div>

            <div>
              <p className="text-xl font-semibold leading-none tracking-tight text-gray-950 dark:text-white">
                {invitationCount}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {invitationCount === 1 ? "Pending invite" : "Pending invites"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main section */}
      <section aria-label="Pending invitations">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Your invitations
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Accept an invite to join a workspace.
            </p>
          </div>

          <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:border-white/[0.09] dark:text-gray-400">
            {invitationCount} {invitationCount === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3 shadow-sm shadow-black/[0.02] dark:border-white/[0.07] dark:bg-[#0d0e12]/80 dark:shadow-none sm:p-4">
          <InvitationsList initialInvitations={shapedInvitations} />
        </div>
      </section>

      {/* Footer note */}
      <footer className="mt-7 flex items-start gap-2.5 text-[11px] leading-5 text-gray-500 dark:text-gray-500">
        <svg
          aria-hidden="true"
          className="mt-0.5 shrink-0"
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
        Invitations are associated with your account email. Only accept
        invitations from people or teams you recognize.
      </footer>
    </main>
  );
}
