// -------------------------------------------------------------
// PendingInvitationsList - Show + revoke pending invitations
// -------------------------------------------------------------
//
// PROPS:
//   workspaceId : string
//   invitations : [{ id, email, role, expiresAt, createdAt, inviteLink }, ...]
//
// FEATURES:
//   - List of pending invites with email + role + days-left
//   - Copy invite link button (per row, with feedback)
//   - Revoke button (per row, with confirm modal)
//   - Empty state when there are no pending invites
//
// NOTE:
//   Revocation uses the workspace-scoped route:
//     DELETE /api/workspaces/[id]/invitations/[invitationId]
//   Not /api/invitations/[id] — Next.js forbids [id] and
//   [token] under the same parent.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No pending invitations.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {invitations.map((inv) => {
            const isBusy = busyId === inv.id;
            const wasCopied = copiedId === inv.id;
            const daysLeft = getDaysLeft(inv.expiresAt);
            const roleLabel = inv.role === 'MANAGER' ? 'Manager' : 'Member';

            return (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-4">
                {/* Email icon */}
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {inv.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {roleLabel} ·{' '}
                    {daysLeft > 0
                      ? `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                      : 'Expiring today'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Copy link */}
                  <button
                    onClick={() => handleCopy(inv)}
                    disabled={isBusy}
                    className={`p-1.5 rounded-lg transition-colors ${
                      wasCopied
                        ? 'text-green-600 bg-green-50 dark:bg-green-950'
                        : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                    } disabled:opacity-40`}
                    title={wasCopied ? 'Copied!' : 'Copy invite link'}
                  >
                    {wasCopied ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
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
                    onClick={() =>
                      setConfirmRevoke({ id: inv.id, email: inv.email })
                    }
                    disabled={isBusy}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 transition-colors"
                    title="Revoke invitation"
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

      {/* Revoke confirmation modal */}
      {confirmRevoke && (
        <ConfirmRevokeModal
          email={confirmRevoke.email}
          loading={busyId === confirmRevoke.id}
          onCancel={() => setConfirmRevoke(null)}
          onConfirm={handleRevoke}
        />
      )}
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
// ConfirmRevokeModal
// =============================================================
const ConfirmRevokeModal = ({ email, loading, onCancel, onConfirm }) => (
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
              Revoke invitation?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The invite link sent to{' '}
              <strong className="text-gray-900 dark:text-white">
                {email}
              </strong>{' '}
              will stop working immediately.
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
            {loading ? 'Revoking...' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default PendingInvitationsList;