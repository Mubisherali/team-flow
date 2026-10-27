"use client";

// -------------------------------------------------------------
// MembersListClient - Premium workspace members management
// -------------------------------------------------------------

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import InviteMemberModal from "./InviteMemberModal";

const MembersListClient = ({
  workspaceId,
  currentUserId,
  currentUserRole,
  initialMembers = [],
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);

  const router = useRouter();

  const canInvite =
    currentUserRole === "OWNER" || currentUserRole === "MANAGER";
  const canChangeRoles = currentUserRole === "OWNER";
  const canRemove =
    currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  // Change a member's role.
  const handleChangeRole = async (userId, newRole) => {
    setBusyUserId(userId);
    setError("");

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update role.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("[CHANGE_ROLE]", err);
      setError("Network error. Please try again.");
    } finally {
      setBusyUserId(null);
    }
  };

  // Remove a member from the workspace.
  const handleRemove = async () => {
    if (!confirmRemove) return;

    const { userId } = confirmRemove;

    setBusyUserId(userId);
    setError("");

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to remove member.");
      } else {
        setConfirmRemove(null);
        router.refresh();
      }
    } catch (err) {
      console.error("[REMOVE_MEMBER]", err);
      setError("Network error. Please try again.");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <>
      {/* Section heading */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-indigo-400"
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Workspace directory
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-[-0.035em] text-white">
              Members
            </h2>

            <span className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 font-mono text-[11px] text-zinc-400">
              {initialMembers.length.toString().padStart(2, "0")}
            </span>
          </div>

          <p className="mt-1.5 text-[12px] text-zinc-500">
            People who currently have access to this workspace.
          </p>
        </div>

        {canInvite && (
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.12)] transition-all duration-200 hover:border-indigo-300/40 hover:bg-indigo-400 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeLinecap="round"
              />
            </svg>
            Invite member
          </button>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="members-error"
            role="alert"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3"
          >
            <svg
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-red-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                d="M12 8v4m0 4h.01"
                strokeLinecap="round"
              />
            </svg>

            <p className="min-w-0 flex-1 text-[12px] leading-5 text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-md p-1 text-red-300/70 transition-colors hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="m18 6-12 12M6 6l12 12"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members surface */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1013]/90 shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
        {/* Table header */}
        {initialMembers.length > 0 && (
          <div className="hidden items-center justify-between border-b border-white/[0.07] bg-white/[0.018] px-5 py-3 sm:flex">
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Member
            </span>

            <span className="pr-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Workspace role
            </span>
          </div>
        )}

        {initialMembers.length === 0 ? (
          <EmptyMembers onInvite={canInvite ? () => setIsInviteOpen(true) : undefined} />
        ) : (
          <ul
            role="list"
            aria-label="Workspace members"
            className="divide-y divide-white/[0.055]"
          >
            {initialMembers.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                index={index}
                isMe={member.userId === currentUserId}
                isOwner={member.role === "OWNER"}
                isBusy={busyUserId === member.userId}
                canChangeRoles={canChangeRoles}
                canRemove={canRemove}
                currentUserRole={currentUserRole}
                onChangeRole={handleChangeRole}
                onRequestRemove={setConfirmRemove}
              />
            ))}
          </ul>
        )}

        {/* Footer */}
        {initialMembers.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-white/[0.06] bg-white/[0.015] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-[10px] text-zinc-600">
              Member access is managed by workspace permissions.
            </span>

            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700">
              TEAMFLOW / MEMBERS
            </span>
          </div>
        )}
      </div>

      {/* Invitation modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={workspaceId}
        onInvited={() => router.refresh()}
      />

      {/* Remove confirmation */}
      <AnimatePresence>
        {confirmRemove && (
          <RemoveConfirmModal
            key="remove-confirm"
            member={confirmRemove}
            loading={busyUserId === confirmRemove.userId}
            onCancel={() => setConfirmRemove(null)}
            onConfirm={handleRemove}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// -------------------------------------------------------------
// MemberRow
// -------------------------------------------------------------

const MemberRow = ({
  member,
  index,
  isMe,
  isOwner,
  isBusy,
  canChangeRoles,
  canRemove,
  currentUserRole,
  onChangeRole,
  onRequestRemove,
}) => {
  const showRoleSelector = canChangeRoles && !isOwner && !isMe;

  const showRemoveButton =
    canRemove &&
    !isMe &&
    !isOwner &&
    !(currentUserRole === "MANAGER" && member.role === "MANAGER");

  const initials = (member.name || member.email || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.li
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        delay: Math.min(index * 0.035, 0.28),
        ease: "easeOut",
      }}
      className="group flex items-center gap-3 px-3.5 py-4 transition-colors duration-200 hover:bg-white/[0.025] sm:gap-4 sm:px-5"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt=""
            className="h-10 w-10 rounded-xl border border-white/[0.09] object-cover sm:h-11 sm:w-11"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/20 to-violet-500/[0.08] text-[12px] font-semibold tracking-wide text-indigo-200 sm:h-11 sm:w-11"
          >
            {initials}
          </div>
        )}

        {isMe && (
          <span
            aria-label="Current user"
            className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0f1013] bg-emerald-400"
          />
        )}
      </div>

      {/* Member identity */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="max-w-full truncate text-[12px] font-semibold text-zinc-100 sm:text-[13px]">
            {member.name || "Unnamed user"}
          </p>

          {isMe && (
            <span className="shrink-0 rounded-md border border-indigo-400/15 bg-indigo-400/[0.07] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-indigo-300">
              You
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-[10px] text-zinc-500 sm:text-[11px]">
          {member.email}
        </p>
      </div>

      {/* Role and actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {showRoleSelector ? (
          <div className="relative">
            <select
              value={member.role}
              onChange={(event) =>
                onChangeRole(member.userId, event.target.value)
              }
              disabled={isBusy}
              aria-label={`Change role for ${member.name || member.email}`}
              className="max-w-[104px] cursor-pointer appearance-none rounded-lg border border-white/[0.09] bg-[#15161a] py-2 pl-2.5 pr-7 text-[10px] font-medium text-zinc-200 outline-none transition-colors hover:border-white/[0.16] focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/10 disabled:cursor-wait disabled:opacity-50 sm:max-w-none sm:pl-3 sm:pr-8 sm:text-[11px]"
            >
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
            </select>

            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="m7 10 5 5 5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <RoleBadge role={member.role} />
        )}

        {isBusy && (
          <span
            role="status"
            aria-label="Updating member"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400/25 border-t-indigo-400"
          />
        )}

        {showRemoveButton && (
          <button
            type="button"
            onClick={() =>
              onRequestRemove({
                userId: member.userId,
                name: member.name || member.email,
                email: member.email,
              })
            }
            disabled={isBusy}
            aria-label={`Remove ${member.name || member.email} from workspace`}
            title="Remove member"
            className="rounded-lg border border-transparent p-2 text-zinc-600 transition-all duration-150 hover:border-red-400/15 hover:bg-red-400/[0.07] hover:text-red-300 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </motion.li>
  );
};

// -------------------------------------------------------------
// RoleBadge
// -------------------------------------------------------------

const RoleBadge = ({ role }) => {
  const styles = {
    OWNER: {
      label: "Owner",
      className:
        "border-amber-400/15 bg-amber-400/[0.07] text-amber-300",
      dot: "bg-amber-400",
    },
    MANAGER: {
      label: "Manager",
      className:
        "border-sky-400/15 bg-sky-400/[0.07] text-sky-300",
      dot: "bg-sky-400",
    },
    MEMBER: {
      label: "Member",
      className:
        "border-white/[0.08] bg-white/[0.035] text-zinc-400",
      dot: "bg-zinc-500",
    },
  };

  const config = styles[role] || styles.MEMBER;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.07em] sm:px-2.5 sm:text-[10px] ${config.className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />
      {config.label}
    </span>
  );
};

// -------------------------------------------------------------
// EmptyMembers
// -------------------------------------------------------------

const EmptyMembers = ({ onInvite }) => (
  <div className="px-5 py-12 text-center sm:py-16">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025]">
      <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-zinc-500"
      >
        <path
          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <h3 className="text-[13px] font-semibold text-zinc-100">
      No team members yet
    </h3>

    <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-zinc-500">
      Your workspace is ready. Invite teammates to start collaborating on
      projects together.
    </p>

    {onInvite && (
      <button
        type="button"
        onClick={onInvite}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2.5 text-[11px] font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M12 5v14M5 12h14"
            strokeLinecap="round"
          />
        </svg>
        Invite your first teammate
      </button>
    )}
  </div>
);

// -------------------------------------------------------------
// RemoveConfirmModal
// -------------------------------------------------------------

const RemoveConfirmModal = ({
  member,
  loading,
  onCancel,
  onConfirm,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) {
        onCancel();
      }
    }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
    role="dialog"
    aria-modal="true"
    aria-labelledby="remove-member-title"
    aria-describedby="remove-member-description"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 5 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101114] shadow-[0_24px_100px_rgba(0,0,0,0.55)]"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.07]">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="text-red-300"
          >
            <path
              d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-red-300/70">
          Access management
        </p>

        <h3
          id="remove-member-title"
          className="text-lg font-semibold tracking-[-0.035em] text-white"
        >
          Remove team member?
        </h3>

        <p
          id="remove-member-description"
          className="mt-2 text-[12px] leading-6 text-zinc-400"
        >
          <span className="font-semibold text-zinc-200">
            {member.name}
          </span>{" "}
          will lose access to this workspace and its projects. This action
          cannot be undone from this dialog.
        </p>

        {member.email && (
          <p className="mt-3 truncate rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[10px] text-zinc-500">
            {member.email}
          </p>
        )}
      </div>

      <div className="flex gap-2.5 border-t border-white/[0.07] bg-white/[0.015] p-4 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-white/[0.09] px-4 py-2.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500 px-4 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              Removing…
            </>
          ) : (
            "Remove member"
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default MembersListClient;
