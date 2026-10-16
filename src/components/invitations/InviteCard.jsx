// -------------------------------------------------------------
// InviteCard - Single pending invitation card
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by <InvitationsList> for each pending invite.
//
// STRUCTURE:
//   Workspace avatar · workspace name + inviter + role · time
//   Actions: Accept | Decline
//
// POLISH:
//   - Glass card surface (#0f1115 in dark)
//   - Framer Motion entry
//   - Accept + Decline get focus rings + active:scale
//   - Inline decline confirm (no native confirm())
//   - Loading state on both buttons
//   - A11y: aria-labels, role=alert on errors
//
// PRESERVED:
//   - Props (invitation, onAccepted, onDeclined)
//   - Accept calls POST /api/invitations/[token]/accept
//   - Decline calls POST /api/invitations/[token]/decline
//   - Success redirects into the workspace
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_LABEL = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

const InviteCard = ({ invitation, onAccepted, onDeclined }) => {
  const router = useRouter();

  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [error, setError] = useState('');

  const ws = invitation.workspace;
  const inviter = invitation.invitedBy;
  const inviterName = inviter?.name || inviter?.email || 'Someone';

  // ─── Workspace initials ───
  const wsInitials = (ws?.name || '?')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  // ─── Accept ───
  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      const res = await fetch(
        `/api/invitations/${invitation.token}/accept`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      onAccepted?.(invitation);
      // Redirect into the workspace.
      router.push(`/workspaces/${data.workspace.id}`);
      router.refresh();
    } catch (err) {
      console.error('[INVITE_ACCEPT]', err);
      setError('Network error. Please try again.');
      setAccepting(false);
    }
  };

  // ─── Decline (inline confirm) ───
  const handleRequestDecline = () => {
    setError('');
    setConfirmDecline(true);
  };

  const handleCancelDecline = () => {
    if (declining) return;
    setConfirmDecline(false);
  };

  const handleConfirmDecline = async () => {
    setDeclining(true);
    setError('');
    try {
      const res = await fetch(
        `/api/invitations/${invitation.token}/decline`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to decline invitation');
        setDeclining(false);
        setConfirmDecline(false);
        return;
      }

      onDeclined?.(invitation);
      router.refresh();
    } catch (err) {
      console.error('[INVITE_DECLINE]', err);
      setError('Network error. Please try again.');
      setDeclining(false);
      setConfirmDecline(false);
    }
  };

  const busy = accepting || declining;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="
        rounded-2xl p-5
        border border-gray-200 dark:border-white/[0.08]
        bg-white dark:bg-[#0f1115]
      "
    >
      <div className="flex items-start gap-4">
        {/* ─── Workspace avatar ─── */}
        <div
          className="
            w-12 h-12 rounded-xl flex-shrink-0
            bg-gradient-to-br from-indigo-500 to-violet-600
            text-white
            flex items-center justify-center
            text-[14px] font-bold
            shadow-lg shadow-indigo-500/20
            ring-1 ring-inset ring-white/20
          "
          aria-hidden="true"
        >
          {wsInitials}
        </div>

        {/* ─── Info ─── */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
            {ws?.name || 'Unknown workspace'}
          </h3>

          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            <strong className="text-gray-700 dark:text-gray-300 font-medium">
              {inviterName}
            </strong>{' '}
            invited you to join as a{' '}
            <span className="inline-flex items-center gap-1">
              <span
                className={`
                  text-[10px] font-semibold uppercase tracking-wide
                  px-1.5 py-0.5 rounded
                  ${
                    invitation.role === 'MANAGER'
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-500/10 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {ROLE_LABEL[invitation.role] || invitation.role}
              </span>
            </span>
          </p>

          <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-2">
            {formatRelative(invitation.createdAt)}
          </p>
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div
          role="alert"
          className="
            mt-4 rounded-xl px-3.5 py-2.5
            bg-red-500/[0.07] dark:bg-red-500/10
            border border-red-500/20
          "
        >
          <p className="text-[12px] text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* ─── Actions ─── */}
      <div className="mt-4 flex items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {confirmDecline ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex-1 flex items-center gap-2"
            >
              <p className="text-[12px] text-gray-600 dark:text-gray-400 flex-1">
                Decline this invitation?
              </p>
              <button
                type="button"
                onClick={handleCancelDecline}
                disabled={declining}
                className="
                  px-3 py-1.5 rounded-lg
                  text-[12px] font-medium
                  text-gray-600 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  active:scale-[0.98]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                  disabled:opacity-50
                  transition-all duration-150
                "
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={declining}
                className="
                  px-3.5 py-1.5 rounded-lg
                  text-[12px] font-medium
                  bg-red-600 hover:bg-red-700
                  disabled:bg-red-400 dark:disabled:bg-red-900
                  active:scale-[0.98]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
                  text-white
                  disabled:cursor-not-allowed
                  transition-all duration-150
                  inline-flex items-center gap-1.5
                "
              >
                {declining ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Declining…
                  </>
                ) : (
                  'Decline'
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex-1 flex items-center justify-end gap-2"
            >
              <button
                type="button"
                onClick={handleRequestDecline}
                disabled={busy}
                className="
                  px-3.5 py-2 rounded-lg
                  text-[13px] font-medium
                  text-gray-600 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  active:scale-[0.98]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={busy}
                className="
                  px-3.5 py-2 rounded-lg
                  text-[13px] font-medium
                  bg-indigo-600 hover:bg-indigo-700
                  disabled:bg-indigo-400 dark:disabled:bg-indigo-800
                  active:scale-[0.98]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                  text-white
                  disabled:cursor-not-allowed
                  transition-all duration-150
                  inline-flex items-center gap-2
                "
              >
                {accepting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Joining…
                  </>
                ) : (
                  'Accept'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// =============================================================
// formatRelative
// =============================================================
function formatRelative(isoString) {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default InviteCard;