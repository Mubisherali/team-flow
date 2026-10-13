// -------------------------------------------------------------
// MembersListClient - Members table with role actions
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered on the workspace members page by an OWNER or
//   MANAGER (or read-only for MEMBERs).
//
// STRUCTURE:
//   Header (title + count + Invite button)
//     - Error banner (glass, role=alert)
//     - Members table (<ul role="list">)
//         - MemberRow (avatar · name/email · role control · remove)
//     - InviteMemberModal
//     - RemoveConfirmModal (AnimatePresence)
//
// POLISH:
//   - Subtle row hover (hints the controls inside)
//   - Glass error surface
//   - Card matches TaskDetailModal surface (dark #0f1115)
//   - Soft indigo focus ring on role select
//   - RemoveConfirmModal matches DeleteConfirmOverlay
//   - Framer Motion entry on remove confirm
//   - Active-scale on every button
//   - A11y: role=alert, aria-labels, semantic list
//
// PRESERVED:
//   - Same props
//   - Same permission logic (canInvite, canChangeRoles,
//     canRemove, showRoleSelector, showRemoveButton)
//   - Same handlers (handleChangeRole, handleRemove)
//   - Same API endpoints
//   - Same sub-components (MemberRow, RoleBadge,
//     RemoveConfirmModal)
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import InviteMemberModal from './InviteMemberModal';

const MembersListClient = ({
  workspaceId,
  currentUserId,
  currentUserRole,
  initialMembers,
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  // confirmRemove = { userId, name, email } | null

  const router = useRouter();

  // ─── Actor permissions ───
  const canInvite = currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';
  const canChangeRoles = currentUserRole === 'OWNER';
  const canRemove = currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  // ─── Change role ───
  const handleChangeRole = async (userId, newRole) => {
    setBusyUserId(userId);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update role');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('[CHANGE_ROLE]', err);
      setError('Network error. Please try again.');
    } finally {
      setBusyUserId(null);
    }
  };

  // ─── Remove member ───
  const handleRemove = async () => {
    if (!confirmRemove) return;
    const { userId } = confirmRemove;

    setBusyUserId(userId);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove member');
      } else {
        setConfirmRemove(null);
        router.refresh();
      }
    } catch (err) {
      console.error('[REMOVE_MEMBER]', err);
      setError('Network error. Please try again.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <>
      {/* ══════════ HEADER ══════════ */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white truncate">
            Members
          </h2>
          <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
            {initialMembers.length}
          </span>
        </div>

        {canInvite && (
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="
              inline-flex items-center gap-1.5
              px-3.5 py-2 rounded-lg flex-shrink-0
              bg-indigo-600 hover:bg-indigo-700
              active:scale-[0.98]
              text-white text-[13px] font-medium
              transition-all duration-150
            "
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Invite member
          </button>
        )}
      </div>

      {/* ══════════ ERROR ══════════ */}
      {error && (
        <div
          role="alert"
          className="
            mb-4 rounded-xl px-3.5 py-3
            bg-red-500/[0.07] dark:bg-red-500/10
            border border-red-500/20
          "
        >
          <p className="text-[12.5px] text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* ══════════ TABLE ══════════ */}
      <div
        className="
          rounded-2xl overflow-hidden
          border border-gray-200 dark:border-white/[0.08]
          bg-white dark:bg-[#0f1115]
        "
      >
        {initialMembers.length === 0 ? (
          <EmptyMembers />
        ) : (
          <ul role="list" className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {initialMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isMe={member.userId === currentUserId}
                isOwner={member.role === 'OWNER'}
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
      </div>

      {/* ══════════ INVITE MODAL ══════════ */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={workspaceId}
        onInvited={() => router.refresh()}
      />

      {/* ══════════ REMOVE CONFIRM ══════════ */}
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

// =============================================================
// MemberRow - single member row
// =============================================================
const MemberRow = ({
  member,
  isMe,
  isOwner,
  isBusy,
  canChangeRoles,
  canRemove,
  currentUserRole,
  onChangeRole,
  onRequestRemove,
}) => {
  // Show role selector, or just a badge?
  const showRoleSelector = canChangeRoles && !isOwner && !isMe;

  // Show the remove (trash) button?
  //   - actor can remove at all
  //   - not self
  //   - not the owner
  //   - if actor is MANAGER, they can't remove other MANAGERs
  const showRemoveButton =
    canRemove &&
    !isMe &&
    !isOwner &&
    !(currentUserRole === 'MANAGER' && member.role === 'MANAGER');

  const initials = (member.name || member.email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <li
      className="
        flex items-center gap-4
        px-5 py-3.5
        hover:bg-gray-50/60 dark:hover:bg-white/[0.02]
        transition-colors duration-150
      "
    >
      {/* ─── Avatar ─── */}
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt=""
          className="
            w-10 h-10 rounded-full object-cover flex-shrink-0
            ring-1 ring-gray-200 dark:ring-white/[0.08]
          "
        />
      ) : (
        <div
          className="
            w-10 h-10 rounded-full flex-shrink-0
            bg-indigo-600 text-white
            flex items-center justify-center
            text-[12px] font-semibold
            ring-1 ring-indigo-500/20
          "
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      {/* ─── Name + email ─── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
            {member.name || 'Unnamed user'}
          </p>
          {isMe && (
            <span
              className="
                text-[10px] font-semibold uppercase tracking-wide
                px-1.5 py-0.5 rounded
                bg-indigo-500/10 dark:bg-indigo-500/15
                text-indigo-700 dark:text-indigo-300
                flex-shrink-0
              "
            >
              You
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-gray-500 dark:text-gray-400 truncate">
          {member.email}
        </p>
      </div>

      {/* ─── Role + remove ─── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showRoleSelector ? (
          <select
            value={member.role}
            onChange={(e) => onChangeRole(member.userId, e.target.value)}
            disabled={isBusy}
            aria-label={`Change role for ${member.name || member.email}`}
            className="
              text-[12px] px-2.5 py-1.5 rounded-lg
              bg-white dark:bg-white/[0.03]
              text-gray-900 dark:text-white
              border border-gray-200 dark:border-white/[0.08]
              focus:outline-none
              focus:ring-2 focus:ring-indigo-500/20
              focus:border-indigo-500 dark:focus:border-indigo-500/60
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
          </select>
        ) : (
          <RoleBadge role={member.role} />
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
            title="Remove from workspace"
            className="
              p-2 rounded-lg
              text-gray-400
              hover:text-red-600 dark:hover:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10
              active:scale-[0.96]
              disabled:opacity-40
              transition-all duration-150
            "
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
};

// =============================================================
// RoleBadge
// =============================================================
const RoleBadge = ({ role }) => {
  const styles = {
    OWNER:
      'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
    MANAGER:
      'bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
    MEMBER:
      'bg-gray-500/10 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400',
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
        styles[role] || styles.MEMBER
      }`}
    >
      {role}
    </span>
  );
};

// =============================================================
// EmptyMembers
// =============================================================
const EmptyMembers = () => (
  <div className="py-12 text-center">
    <div
      className="
        w-12 h-12 mx-auto mb-3 rounded-full
        bg-gray-100 dark:bg-white/[0.04]
        flex items-center justify-center
      "
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-gray-400 dark:text-gray-500"
      >
        <path
          d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-1">
      No members yet
    </p>
    <p className="text-[12px] text-gray-500 dark:text-gray-400">
      Invite someone to get started.
    </p>
  </div>
);

// =============================================================
// RemoveConfirmModal - matches DeleteConfirmOverlay
// =============================================================
const RemoveConfirmModal = ({ member, loading, onCancel, onConfirm }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
    onClick={() => !loading && onCancel()}
    className="
      fixed inset-0 z-50
      flex items-center justify-center
      p-3 sm:p-4
      bg-black/50 dark:bg-black/70
      backdrop-blur-sm
    "
    role="dialog"
    aria-modal="true"
    aria-labelledby="remove-member-title"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={(e) => e.stopPropagation()}
      className="
        relative w-full max-w-sm
        bg-white dark:bg-[#0f1115]
        rounded-2xl
        border border-gray-200 dark:border-white/[0.08]
        shadow-2xl shadow-black/20 dark:shadow-black/60
        p-6
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            w-10 h-10 rounded-full flex-shrink-0
            bg-red-500/10 dark:bg-red-500/15
            flex items-center justify-center
          "
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-red-600 dark:text-red-400"
          >
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0 pt-0.5">
          <h3
            id="remove-member-title"
            className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1"
          >
            Remove member?
          </h3>
          <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong className="text-gray-900 dark:text-white font-medium">
              {member.name}
            </strong>{' '}
            will lose access to this workspace and its projects.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="
            flex-1 py-2.5 rounded-xl
            border border-gray-300 dark:border-white/[0.08]
            text-gray-700 dark:text-gray-300
            text-[13px] font-medium
            hover:bg-gray-50 dark:hover:bg-white/[0.04]
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="
            flex-1 py-2.5 rounded-xl
            bg-red-600 hover:bg-red-700
            disabled:bg-red-400 dark:disabled:bg-red-900
            active:scale-[0.98]
            text-white text-[13px] font-medium
            disabled:cursor-not-allowed
            transition-all duration-150
            inline-flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Removing…
            </>
          ) : (
            'Remove'
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default MembersListClient;