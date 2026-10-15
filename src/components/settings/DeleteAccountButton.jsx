// -------------------------------------------------------------
// DeleteAccountButton - Danger zone account deletion
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the danger zone on the profile settings
//   page.
//
// STRUCTURE:
//   Trigger button (disabled when user owns workspaces)
//     - Confirmation modal (AnimatePresence)
//       - Header (warning icon + title)
//       - Body (danger notice + email input + password input)
//       - Footer (Cancel / Delete permanently)
//
// POLISH:
//   - Modal matches DeleteWorkspaceButton exactly
//   - Glass red surfaces
//   - Body scroll lock while open
//   - Esc closes (respects loading)
//   - Inputs get soft red focus ring
//   - Delete button gets spinner + active:scale + focus ring
//   - A11y: role=dialog, aria-modal, aria-labelledby,
//     aria-describedby, aria-invalid, role=alert
//
// PRESERVED:
//   - Props (ownedWorkspaceCount, hasPassword)
//   - State (isOpen, confirmEmail, password, loading, error)
//   - canDelete guard (email match + password if hasPassword)
//   - DELETE /api/users/me (with password body when applicable)
//   - signOut() + redirect to /login
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteAccountButton = ({ ownedWorkspaceCount, hasPassword }) => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const userEmail = session?.user?.email || '';
  const isBlocked = ownedWorkspaceCount > 0;

  // Email must match exactly (case-insensitive, trimmed)
  const emailMatches =
    confirmEmail.trim().toLowerCase() === userEmail.toLowerCase();

  // Password required only if user has one
  const passwordReady = !hasPassword || password.length > 0;

  const canDelete = emailMatches && passwordReady;

  // ─── Esc closes (respects loading) ───
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  // ─── Body scroll lock ───
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleOpen = () => {
    if (isBlocked) return;
    setIsOpen(true);
    setConfirmEmail('');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setConfirmEmail('');
      setPassword('');
      setError('');
    }
  };

  const handleDelete = async () => {
    if (!canDelete || loading) return;

    setLoading(true);
    setError('');

    try {
      const body = {};
      if (hasPassword) body.password = password;

      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete account');
        setLoading(false);
        return;
      }

      // Success → sign out → redirect
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('[DELETE_ACCOUNT]', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* ─── Trigger ─── */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={isBlocked}
        title={
          isBlocked
            ? 'Delete or transfer your workspaces first'
            : 'Delete your account'
        }
        aria-disabled={isBlocked}
        className={`
          px-3.5 py-2 rounded-lg flex-shrink-0
          text-[13px] font-medium
          transition-all duration-150
          ${
            isBlocked
              ? 'bg-gray-200 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40'
          }
        `}
      >
        Delete account
      </button>

      {/* ══════════ CONFIRM MODAL ══════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="delete-account"
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
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-desc"
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
                      d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  id="delete-account-title"
                  className="text-[14px] font-semibold text-gray-900 dark:text-white"
                >
                  Delete account
                </h2>
              </div>

              {/* ─── Body ─── */}
              <div className="p-5 sm:p-6 space-y-5">
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

                <div
                  className="
                    rounded-xl px-3.5 py-3
                    bg-red-500/[0.07] dark:bg-red-500/10
                    border border-red-500/20
                  "
                >
                  <p
                    id="delete-account-desc"
                    className="text-[12.5px] text-red-700 dark:text-red-300 leading-relaxed"
                  >
                    <strong className="font-semibold">
                      This cannot be undone.
                    </strong>{' '}
                    Your account, memberships, tasks you created, and all
                    related data will be permanently removed.
                  </p>
                </div>

                {/* Confirm email */}
                <div>
                  <label
                    htmlFor="confirm-email"
                    className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Type{' '}
                    <span className="font-mono text-red-600 dark:text-red-400">
                      {userEmail}
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    id="confirm-email"
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={userEmail}
                    autoFocus
                    disabled={loading}
                    aria-invalid={confirmEmail.length > 0 && !emailMatches}
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

                {/* Password (credentials users only) */}
                {hasPassword && (
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      Your password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                      autoComplete="current-password"
                      className="
                        w-full px-3 py-2.5 rounded-xl
                        text-[13px]
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
                )}
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

export default DeleteAccountButton;