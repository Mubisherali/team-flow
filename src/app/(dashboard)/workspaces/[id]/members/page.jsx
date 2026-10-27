
// -------------------------------------------------------------
// Members Page - /workspaces/[id]/members
// -------------------------------------------------------------

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMemberRole,
  canViewWorkspace,
  canInviteMembers,
} from "@/lib/permissions";
import MembersListClient from "@/components/workspace/MembersListClient";
import PendingInvitationsList from "@/components/workspace/PendingInvitationsList";

export default async function MembersPage({ params }) {
  // 1. Authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id: workspaceId } = await params;

  // 2. Verify workspace membership
  const role = await getMemberRole(session.user.id, workspaceId);

  if (!canViewWorkspace(role)) {
    notFound();
  }

  // 3. Fetch workspace details
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  // 4. Fetch workspace members
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

  // Owners first, then managers, then members.
  // Members with the same role are ordered by join date.
  const roleWeight = {
    OWNER: 0,
    MANAGER: 1,
    MEMBER: 2,
  };

  const shapedMembers = [...memberships]
    .sort((a, b) => {
      const roleDifference =
        (roleWeight[a.role] ?? 99) - (roleWeight[b.role] ?? 99);

      if (roleDifference !== 0) {
        return roleDifference;
      }

      return new Date(a.joinedAt) - new Date(b.joinedAt);
    })
    .map((membership) => ({
      id: membership.id,
      userId: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      avatarUrl: membership.user.avatarUrl,
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString(),
    }));

  // 5. Fetch invitations only for users allowed to invite.
  let pendingInvitations = [];

  if (canInviteMembers(role)) {
    const invitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");

    pendingInvitations = invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      inviteLink: `${appUrl}/invite/${invitation.token}`,
    }));
  }

  // 6. Render
  return (
    <main className="relative min-h-full overflow-hidden bg-[#0a0a0b] text-[#f4f4f5]">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 right-[-8rem] h-80 w-80 rounded-full bg-indigo-500/[0.08] blur-[110px]" />
        <div className="absolute left-[-10rem] top-[32rem] h-72 w-72 rounded-full bg-violet-500/[0.05] blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {/* Back link */}
        <Link
          href={`/workspaces/${workspaceId}`}
          className="group mb-8 inline-flex items-center gap-2 rounded-md text-[12px] font-medium text-zinc-500 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0b]"
        >
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            <path
              d="M19 12H5m7 7-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to workspace
        </Link>

        {/* Page header */}
        <header className="mb-9 border-b border-white/[0.08] pb-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-indigo-400"
              />
              Workspace settings
            </span>

            <span className="font-mono text-[10px] text-zinc-600">
              / TEAM
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">
                Team members
              </h1>

              <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500">
                Manage workspace access, member roles, and invitations.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-zinc-500"
              >
                <path
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="text-[12px] text-zinc-400">
                <span className="font-semibold text-white">
                  {shapedMembers.length}
                </span>{" "}
                {shapedMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          <div className="mt-5 flex min-w-0 items-center gap-2 text-[11px] text-zinc-600">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400/80" />
            <span className="truncate">{workspace.name}</span>
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
            <span className="truncate font-mono">{workspace.slug}</span>
          </div>
        </header>

        {/* Members */}
        <section aria-label="Workspace members" className="mb-10 sm:mb-12">
          <MembersListClient
            workspaceId={workspaceId}
            currentUserId={session.user.id}
            currentUserRole={role}
            initialMembers={shapedMembers}
          />
        </section>

        {/* Pending invitations */}
        {canInviteMembers(role) && (
          <section
            aria-labelledby="pending-invites-heading"
            className="border-t border-white/[0.08] pt-7"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-amber-400"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Access management
                  </span>
                </div>

                <h2
                  id="pending-invites-heading"
                  className="text-lg font-semibold tracking-[-0.03em] text-white"
                >
                  Pending invitations
                </h2>

                <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                  Invitations waiting to be accepted by your teammates.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400">
                <span className="font-mono text-white">
                  {pendingInvitations.length.toString().padStart(2, "0")}
                </span>
                pending
              </span>
            </div>

            <PendingInvitationsList
              workspaceId={workspaceId}
              invitations={pendingInvitations}
            />
          </section>
        )}
      </div>
    </main>
  );
}