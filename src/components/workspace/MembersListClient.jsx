// -------------------------------------------------------------
// MembersListClient - Members table with role actions
// -------------------------------------------------------------
//
// PROPS:
//   workspaceId       : string
//   currentUserId     : string (the logged-in user's id)
//   currentUserRole   : 'OWNER' | 'MANAGER' | 'MEMBER'
//   initialMembers    : [{ id, userId, name, email, avatarUrl, role, joinedAt }, ...]
//
// WHAT IT RENDERS:
//   - Header with "Invite member" button (owner/manager only)
//   - Table of members with role badge/selector + remove button
//   - InviteMemberModal (triggered by the button)
//
// PERMISSIONS IN THE UI:
//   - Invite:   OWNER or MANAGER
//   - Change role: OWNER only, and not on self or owner
//   - Remove:   OWNER or MANAGER, but:
//                 - not self
//                 - not the owner
//                 - MANAGERs can't remove other MANAGERs
//
// The API re-checks all of these anyway (never trust the client).
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import InviteMemberModal from './InviteMemberModal';

const MembersListClient = ({
  workspaceId,
  currentUserId,
  currentUserRole,
  initialMembers,
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null); // which row is processing
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  // confirmRemove = { userId, name, email } | null

  const router = useRouter();

  // ─── Actor permissions (UI-side convenience) ───
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
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Members
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            {initialMembers.length}
          </span>
        </h2>

        {canInvite && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Invite member
          </button>
        )}
      </div>

      {/* ─── Error banner ─── */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ─── Members table ─── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {initialMembers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No members yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
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

      {/* ─── Invite modal ─── */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={workspaceId}
        onInvited={() => router.refresh()}
      />

      {/* ─── Remove confirmation modal ─── */}
      {confirmRemove && (
        <RemoveConfirmModal
          member={confirmRemove}
          loading={busyUserId === confirmRemove.userId}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={handleRemove}
        />
      )}
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
  // Should we show role selector, or just a badge?
  const showRoleSelector = canChangeRoles && !isOwner && !isMe;

  // Should we show the remove (trash) button?
  //   - actor can remove at all
  //   - not self
  //   - not the owner
  //   - if actor is MANAGER, they can't remove other MANAGERs
  const showRemoveButton =
    canRemove &&
    !isMe &&
    !isOwner &&
    !(currentUserRole === 'MANAGER' && member.role === 'MANAGER');

  // Initials fallback for the avatar
  const initials = (member.name || member.email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      {/* Avatar */}
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt=""
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
      )}

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {member.name || 'Unnamed user'}
          </p>
          {isMe && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              YOU
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {member.email}
        </p>
      </div>

      {/* Role + remove */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showRoleSelector ? (
          <select
            value={member.role}
            onChange={(e) => onChangeRole(member.userId, e.target.value)}
            disabled={isBusy}
            className="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
          </select>
        ) : (
          <RoleBadge role={member.role} />
        )}

        {showRemoveButton && (
          <button
            onClick={() =>
              onRequestRemove({
                userId: member.userId,
                name: member.name || member.email,
                email: member.email,
              })
            }
            disabled={isBusy}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 transition-colors"
            title="Remove from workspace"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
    OWNER: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    MANAGER: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    MEMBER: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
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
// RemoveConfirmModal - small confirmation before removing
// =============================================================
const RemoveConfirmModal = ({ member, loading, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={() => !loading && onCancel()}
  >
    <div
      className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
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
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Remove member?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">
                {member.name}
              </strong>{' '}
              will lose access to this workspace and its projects.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium transition-colors"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default MembersListClient;