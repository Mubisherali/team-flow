// -------------------------------------------------------------
// DeleteWorkspaceButton - Danger zone button + confirmation modal
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the danger zone on the workspace
//   settings page.
//
// STRUCTURE:
//   Trigger button
//     - Confirmation modal (AnimatePresence)
//       - Header (warning icon + title)
//       - Body (explanation + type-to-confirm input)
//       - Footer (Cancel / Delete permanently)
//
// POLISH:
//   - Modal matches DeleteConfirmOverlay (dark #0f1115, motion)
//   - Glass red error surface
//   - Body scroll lock while open
//   - Esc closes (respects loading)
//   - Type-to-confirm input gets soft red focus ring
//   - Delete button gets spinner + active:scale + focus ring
//   - A11y: role=dialog, aria-modal, aria-labelledby,
//     aria-describedby, aria-invalid on input
//
// PRESERVED:
//   - Props (workspaceId, workspaceName)
//   - State (isOpen, confirmText, loading, error)
//   - canDelete guard (exact name match)
//   - DELETE /api/workspaces/:id
//   - router.push('/workspaces') + router.refresh()
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteWorkspaceButton = ({ workspaceId, workspaceName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  // User must type the exact workspace name to enable the button.
  const canDelete = confirmText.trim() === workspaceName.trim();

  // ─── Escape closes (respects loading) ───
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  // ─── Body scroll lock while open ───
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setConfirmText('');
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setConfirmText('');
      setError('');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete workspace');
        setLoading(false);
        return;
      }

      // Redirect to workspace list — router.refresh ensures the
      // sidebar re-fetches and drops this workspace.
      router.push('/workspaces');
      router.refresh();
    } catch (err) {
      console.error('[DELETE_WORKSPACE]', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="
          px-3.5 py-2 rounded-lg
          bg-red-600 hover:bg-red-700
          active:scale-[0.98]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
          text-white text-[13px] font-medium
          self-start sm:self-auto flex-shrink-0
          transition-all duration-150
        "
      >
        Delete workspace
      </button>

      {/* ══════════ CONFIRM MODAL ══════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="delete-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={handleClose}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              p-3 sm:p-4
              bg-black/50 dark:bg-black/70
              backdrop-blur-sm
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-workspace-title"
            aria-describedby="delete-workspace-desc"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative w-full max-w-md
                bg-white dark:bg-[#0f1115]
                rounded-2xl
                border border-gray-200 dark:border-white/[0.08]
                shadow-2xl shadow-black/20 dark:shadow-black/60
                max-h-[92vh] overflow-y-auto
              "
            >
              {/* ─── Header ─── */}
              <div
                className="
                  flex items-center gap-3
                  px-5 py-4
                  border-b border-gray-200 dark:border-white/[0.06]
                "
              >
                <div
                  className="
                    w-9 h-9 rounded-full flex-shrink-0
                    bg-red-500/10 dark:bg-red-500/15
                    flex items-center justify-center
                  "
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-red-600 dark:text-red-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  id="delete-workspace-title"
                  className="text-[14px] font-semibold text-gray-900 dark:text-white"
                >
                  Delete workspace
                </h2>
              </div>

              {/* ─── Body ─── */}
              <div className="p-5 sm:p-6 space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="
                      rounded-xl px-3.5 py-3
                      bg-red-500/[0.07] dark:bg-red-500/10
                      border border-red-500/20
                    "
                  >
                    <p className="text-[12.5px] text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}

                <p
                  id="delete-workspace-desc"
                  className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed"
                >
                  This will permanently delete{' '}
                  <strong className="text-gray-900 dark:text-white font-medium">
                    {workspaceName}
                  </strong>{' '}
                  and all its projects, tasks, and member links. This action
                  cannot be undone.
                </p>

                <div>
                  <label
                    htmlFor="confirm-delete"
                    className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Type{' '}
                    <span className="font-mono text-red-600 dark:text-red-400">
                      {workspaceName}
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    id="confirm-delete"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={workspaceName}
                    autoFocus
                    disabled={loading}
                    aria-invalid={confirmText.length > 0 && !canDelete}
                    className="
                      w-full px-3 py-2.5 rounded-xl
                      text-[13px] font-mono
                      bg-white dark:bg-white/[0.03]
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      border border-gray-200 dark:border-white/[0.08]
                      focus:outline-none
                      focus:ring-2 focus:ring-red-500/20
                      focus:border-red-500 dark:focus:border-red-500/60
                      disabled:opacity-60
                      transition-all duration-150
                    "
                  />
                </div>
              </div>

              {/* ─── Footer ─── */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="
                    flex-1 py-2.5 rounded-xl
                    border border-gray-300 dark:border-white/[0.08]
                    text-gray-700 dark:text-gray-300
                    text-[13px] font-medium
                    hover:bg-gray-50 dark:hover:bg-white/[0.04]
                    active:scale-[0.98]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150
                  "
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDelete || loading}
                  className="
                    flex-1 py-2.5 rounded-xl
                    bg-red-600 hover:bg-red-700
                    disabled:bg-gray-200 dark:disabled:bg-white/[0.06]
                    disabled:text-gray-400 dark:disabled:text-gray-500
                    disabled:cursor-not-allowed
                    active:scale-[0.98]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
                    text-white text-[13px] font-medium
                    transition-all duration-150
                    inline-flex items-center justify-center gap-2
                  "
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Delete permanently'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DeleteWorkspaceButton;