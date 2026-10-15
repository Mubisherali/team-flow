// -------------------------------------------------------------
// ProjectMembersModal - Manage who's on a project
// -------------------------------------------------------------
//
// WHEN USED:
//   Opened from ManageMembersButton on the project detail page.
//
// STRUCTURE:
//   Backdrop (animated)
//     - Modal card (animated)
//         - Header (title + close)
//         - Body (scrollable):
//             - Error alert (glass)
//             - "On this project" list
//             - "Add from workspace" list
//         - Footer (Done button)
//
// POLISH:
//   - Framer Motion entry + exit
//   - Glass error surface
//   - Body scroll lock while open
//   - Remove uses inline confirm (no native confirm())
//   - Icon buttons + row hover match Wave-3 patterns
//   - A11y: role=dialog, aria-modal, aria-labelledby,
//     role=alert, aria-labels on actions
//
// PRESERVED:
//   - Same props
//   - Same state (busyUserId, error)
//   - Same handlers (handleAdd, handleRemove)
//   - Same API endpoints (POST / DELETE)
//   - Same diffing logic (allMembers vs projectMembers)
//   - Same router.refresh() after each action
//   - Sub-component Avatar
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectMembersModal = ({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  projectMembers,
  allMembers,
  currentUserId,
}) => {
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  // confirmRemove = { userId, name } | null

  const router = useRouter();

  // ─── Reset transient state when the modal opens ───
  useEffect(() => {
    if (isOpen) {
      setBusyUserId(null);
      setError('');
      setConfirmRemove(null);
    }
  }, [isOpen]);

  // ─── Esc closes (unless mid-request) ───
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' && !busyUserId) onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, busyUserId, onClose]);

  // ─── Body scroll lock while open ───
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ─── Compute "available" list ───
  const projectUserIds = new Set(projectMembers.map((m) => m.userId));
  const availableMembers = allMembers.filter(
    (m) => !projectUserIds.has(m.userId)
  );

  // ─── Add member ───
  const handleAdd = async (userId) => {
    setBusyUserId(userId);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add member');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('[ADD_PROJECT_MEMBER]', err);
      setError('Network error. Please try again.');
    } finally {
      setBusyUserId(null);
    }
  };

  // ─── Remove member (inline confirm) ───
  const handleRequestRemove = (userId, name) => {
    setError('');
    setConfirmRemove({ userId, name });
  };

  const handleCancelRemove = () => {
    if (busyUserId) return;
    setConfirmRemove(null);
  };

  const handleConfirmRemove = async () => {
    if (!confirmRemove) return;
    const { userId } = confirmRemove;

    setBusyUserId(userId);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/members/${userId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove member');
        setConfirmRemove(null);
      } else {
        setConfirmRemove(null);
        router.refresh();
      }
    } catch (err) {
      console.error('[REMOVE_PROJECT_MEMBER]', err);
      setError('Network error. Please try again.');
      setConfirmRemove(null);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="project-members-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={() => !busyUserId && onClose()}
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            p-3 sm:p-4
            bg-black/50 dark:bg-black/70
            backdrop-blur-sm
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-members-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative w-full max-w-lg
              bg-white dark:bg-[#0f1115]
              rounded-2xl
              border border-gray-200 dark:border-white/[0.08]
              shadow-2xl shadow-black/20 dark:shadow-black/60
              max-h-[85vh]
              flex flex-col
              overflow-hidden
            "
          >
            {/* ══════════ HEADER ══════════ */}
            <div
              className="
                flex items-center justify-between flex-shrink-0
                px-5 py-4
                border-b border-gray-200 dark:border-white/[0.06]
              "
            >
              <h2
                id="project-members-title"
                className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Project members
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={!!busyUserId}
                aria-label="Close"
                className="
                  p-2 rounded-lg
                  text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  active:scale-[0.96]
                  disabled:opacity-50
                  transition-all duration-150
                "
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ══════════ BODY ══════════ */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
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

              {/* ─── Section: On this project ─── */}
              <section aria-labelledby="on-project-heading">
                <h3
                  id="on-project-heading"
                  className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3"
                >
                  On this project ({projectMembers.length})
                </h3>

                {projectMembers.length === 0 ? (
                  <p className="text-[12.5px] text-gray-500 dark:text-gray-400 italic">
                    No members yet.
                  </p>
                ) : (
                  <ul role="list" className="space-y-0.5">
                    <AnimatePresence initial={false}>
                      {projectMembers.map((m) => {
                        const isMe = m.userId === currentUserId;
                        const isBusy = busyUserId === m.userId;
                        const isConfirming =
                          confirmRemove?.userId === m.userId;

                        return (
                          <motion.li
                            key={m.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="
                              flex items-center gap-3 p-2 rounded-lg
                              hover:bg-gray-50 dark:hover:bg-white/[0.02]
                              transition-colors duration-150
                            "
                          >
                            <Avatar
                              name={m.name}
                              email={m.email}
                              image={m.avatarUrl}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                                  {m.name || 'Unnamed'}
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
                                {m.email}
                              </p>
                            </div>

                            {!isMe && !isConfirming && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRequestRemove(
                                    m.userId,
                                    m.name || m.email
                                  )
                                }
                                disabled={isBusy}
                                aria-label={`Remove ${m.name || m.email} from project`}
                                className="
                                  p-2 rounded-lg
                                  text-gray-400
                                  hover:text-red-600 dark:hover:text-red-400
                                  hover:bg-red-50 dark:hover:bg-red-500/10
                                  active:scale-[0.96]
                                  disabled:opacity-40
                                  transition-all duration-150
                                  flex-shrink-0
                                "
                              >
                                <svg
                                  width="14"
                                  height="14"
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
                            )}

                            {/* Inline confirm swap */}
                            {!isMe && isConfirming && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={handleCancelRemove}
                                  disabled={isBusy}
                                  className="
                                    px-2 py-1 rounded-md
                                    text-[11.5px] font-medium
                                    text-gray-600 dark:text-gray-400
                                    hover:bg-gray-100 dark:hover:bg-white/[0.06]
                                    disabled:opacity-50
                                    transition-colors duration-150
                                  "
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleConfirmRemove}
                                  disabled={isBusy}
                                  className="
                                    px-2.5 py-1 rounded-md
                                    text-[11.5px] font-medium
                                    bg-red-600 hover:bg-red-700
                                    disabled:bg-red-400 dark:disabled:bg-red-900
                                    text-white
                                    active:scale-[0.96]
                                    transition-all duration-150
                                    inline-flex items-center gap-1
                                  "
                                >
                                  {isBusy ? (
                                    <>
                                      <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                      Removing…
                                    </>
                                  ) : (
                                    'Remove'
                                  )}
                                </button>
                              </div>
                            )}
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </section>

              {/* ─── Section: Add from workspace ─── */}
              <section aria-labelledby="add-from-workspace-heading">
                <h3
                  id="add-from-workspace-heading"
                  className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3"
                >
                  Add from workspace ({availableMembers.length})
                </h3>

                {availableMembers.length === 0 ? (
                  <p className="text-[12.5px] text-gray-500 dark:text-gray-400 italic">
                    Everyone in the workspace is already on this project.
                  </p>
                ) : (
                  <ul role="list" className="space-y-0.5">
                    {availableMembers.map((m) => {
                      const isBusy = busyUserId === m.userId;

                      return (
                        <li
                          key={m.id}
                          className="
                            flex items-center gap-3 p-2 rounded-lg
                            hover:bg-gray-50 dark:hover:bg-white/[0.02]
                            transition-colors duration-150
                          "
                        >
                          <Avatar
                            name={m.name}
                            email={m.email}
                            image={m.avatarUrl}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                              {m.name || 'Unnamed'}
                            </p>
                            <p className="text-[11.5px] text-gray-500 dark:text-gray-400 truncate">
                              {m.email}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdd(m.userId)}
                            disabled={isBusy}
                            aria-label={`Add ${m.name || m.email} to project`}
                            className="
                              px-2.5 py-1 rounded-md
                              text-[11.5px] font-medium
                              text-indigo-600 dark:text-indigo-400
                              hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                              active:scale-[0.96]
                              disabled:opacity-40
                              transition-all duration-150
                              flex-shrink-0
                              inline-flex items-center gap-1
                            "
                          >
                            {isBusy ? (
                              <>
                                <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Adding…
                              </>
                            ) : (
                              <>
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M12 5v14M5 12h14"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                Add
                              </>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            {/* ══════════ FOOTER ══════════ */}
            <div
              className="
                flex justify-end flex-shrink-0
                px-5 py-4
                border-t border-gray-200 dark:border-white/[0.06]
                bg-gray-50/60 dark:bg-white/[0.015]
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={!!busyUserId}
                className="
                  px-4 py-2 rounded-xl
                  bg-indigo-600 hover:bg-indigo-700
                  disabled:bg-indigo-400 dark:disabled:bg-indigo-800
                  active:scale-[0.98]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                  disabled:cursor-not-allowed
                  text-white text-[13px] font-medium
                  transition-all duration-150
                "
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================================
// Avatar - consistent user avatar (image or initials)
// =============================================================
const Avatar = ({ name, email, image }) => {
  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="
          w-9 h-9 rounded-full object-cover flex-shrink-0
          ring-1 ring-gray-200 dark:ring-white/[0.08]
        "
      />
    );
  }

  return (
    <div
      className="
        w-9 h-9 rounded-full flex-shrink-0
        bg-indigo-600 text-white
        flex items-center justify-center
        text-[11px] font-semibold
        ring-1 ring-indigo-500/20
      "
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

export default ProjectMembersModal;