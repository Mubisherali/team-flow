// -------------------------------------------------------------
// PendingInvitationsList - Show + revoke pending invitations
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered on the workspace members page, below the members
//   table, for OWNERs and MANAGERs.
//
// STRUCTURE:
//   - Empty state (dashed card w/ icon)
//   - List card: <ul role="list"> of invite rows
//       - Avatar (mail icon)
//       - Email + role · days-left
//       - Copy link + Revoke buttons
//   - ConfirmRevokeModal (AnimatePresence)
//
// POLISH:
//   - Card matches TaskDetailModal surface (dark #0f1115)
//   - Glass error surface + role=alert
//   - Icon buttons match modal's icon-button pattern
//   - Copy button flips to emerald w/ checkmark
//   - ConfirmRevokeModal matches DeleteConfirmOverlay
//   - Framer Motion entry on revoke modal
//   - Active-scale on every button
//   - A11y: aria-labels, semantic list, dialog roles
//
// PRESERVED:
//   - Same props (workspaceId, invitations)
//   - Same state (busyId, error, copiedId, confirmRevoke)
//   - Same handlers (handleCopy, handleRevoke)
//   - Same API endpoints
//   - Same getDaysLeft helper
//   - Same sub-component names (ConfirmRevokeModal)
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PendingInvitationsList = ({ workspaceId, invitations }) => {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  // confirmRevoke = { id, email } | null

  const router = useRouter();

  // ─── Copy invite link ───
  const handleCopy = async (invitation) => {
    try {
      await navigator.clipboard.writeText(invitation.inviteLink);
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error('[COPY_FAILED]', err);
      setError('Could not copy to clipboard. Copy manually.');
    }
  };

  // ─── Revoke ───
  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    const { id } = confirmRevoke;

    setBusyId(id);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/invitations/${id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to revoke invitation');
      } else {
        setConfirmRevoke(null);
        router.refresh();
      }
    } catch (err) {
      console.error('[REVOKE_INVITE]', err);
      setError('Network error. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  // ─── Empty state ───
  if (!invitations || invitations.length === 0) {
    return <EmptyInvitations />;
  }

  return (
    <>
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

      {/* ══════════ LIST ══════════ */}
      <div
        className="
          rounded-2xl overflow-hidden
          border border-gray-200 dark:border-white/[0.08]
          bg-white dark:bg-[#0f1115]
        "
      >
        <ul role="list" className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {invitations.map((inv) => {
            const isBusy = busyId === inv.id;
            const wasCopied = copiedId === inv.id;
            const daysLeft = getDaysLeft(inv.expiresAt);
            const roleLabel = inv.role === 'MANAGER' ? 'Manager' : 'Member';

            return (
              <li
                key={inv.id}
                className="
                  flex items-center gap-3.5
                  px-5 py-3.5
                  hover:bg-gray-50/60 dark:hover:bg-white/[0.02]
                  transition-colors duration-150
                "
              >
                {/* ─── Mail icon ─── */}
                <div
                  className="
                    w-10 h-10 rounded-full flex-shrink-0
                    bg-gray-100 dark:bg-white/[0.04]
                    flex items-center justify-center
                    ring-1 ring-gray-200 dark:ring-white/[0.08]
                  "
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="text-gray-500 dark:text-gray-400"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path
                      d="M22 6l-10 7L2 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* ─── Info ─── */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                    {inv.email}
                  </p>
                  <p className="text-[11.5px] text-gray-500 dark:text-gray-400 truncate">
                    {roleLabel} ·{' '}
                    {daysLeft > 0
                      ? `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                      : 'Expiring today'}
                  </p>
                </div>

                {/* ─── Actions ─── */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {/* Copy link */}
                  <button
                    type="button"
                    onClick={() => handleCopy(inv)}
                    disabled={isBusy}
                    aria-label={
                      wasCopied
                        ? 'Invitation link copied'
                        : `Copy invite link for ${inv.email}`
                    }
                    title={wasCopied ? 'Copied!' : 'Copy invite link'}
                    className={`
                      p-2 rounded-lg
                      active:scale-[0.96]
                      disabled:opacity-40
                      transition-all duration-150
                      ${
                        wasCopied
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/[0.15]'
                          : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                      }
                    `}
                  >
                    {wasCopied ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path
                          d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Revoke */}
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmRevoke({ id: inv.id, email: inv.email })
                    }
                    disabled={isBusy}
                    aria-label={`Revoke invitation for ${inv.email}`}
                    title="Revoke invitation"
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
                        d="M18 6L6 18M6 6l12 12"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ══════════ REVOKE CONFIRM ══════════ */}
      <AnimatePresence>
        {confirmRevoke && (
          <ConfirmRevokeModal
            key="revoke-confirm"
            email={confirmRevoke.email}
            loading={busyId === confirmRevoke.id}
            onCancel={() => setConfirmRevoke(null)}
            onConfirm={handleRevoke}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// =============================================================
// getDaysLeft - friendly days-remaining calculation
// =============================================================
function getDaysLeft(expiresAt) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// =============================================================
// EmptyInvitations
// =============================================================
const EmptyInvitations = () => (
  <div
    className="
      rounded-2xl px-6 py-10 text-center
      border border-dashed
      border-gray-200 dark:border-white/[0.08]
      bg-white/60 dark:bg-white/[0.02]
    "
  >
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
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path
          d="M22 6l-10 7L2 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-1">
      No pending invitations
    </p>
    <p className="text-[12px] text-gray-500 dark:text-gray-400">
      Invites you send will appear here until they&apos;re accepted.
    </p>
  </div>
);

// =============================================================
// ConfirmRevokeModal - matches DeleteConfirmOverlay
// =============================================================
const ConfirmRevokeModal = ({ email, loading, onCancel, onConfirm }) => (
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
    aria-labelledby="revoke-invite-title"
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
            id="revoke-invite-title"
            className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1"
          >
            Revoke invitation?
          </h3>
          <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed break-words">
            The invite link sent to{' '}
            <strong className="text-gray-900 dark:text-white font-medium">
              {email}
            </strong>{' '}
            will stop working immediately.
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
              Revoking…
            </>
          ) : (
            'Revoke'
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default PendingInvitationsList;