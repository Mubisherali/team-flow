// -------------------------------------------------------------
// DeleteAccountButton - Danger zone account deletion
// -------------------------------------------------------------
//
// PROPS:
//   ownedWorkspaceCount : number
//   hasPassword         : boolean (credentials user or OAuth-only)
//
// TWO STATES:
//   1. Owns workspaces  → button disabled, message shown
//   2. No workspaces    → button enabled, opens confirmation modal
//
// CONFIRMATION MODAL REQUIRES:
//   - Typing the user's email exactly
//   - If credentials user: also entering password
//
// AFTER SUCCESS:
//   - signOut() → clear session cookie
//   - redirect to /login
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

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
      <button
        type="button"
        onClick={handleOpen}
        disabled={isBlocked}
        title={
          isBlocked
            ? 'Delete or transfer your workspaces first'
            : 'Delete your account'
        }
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
          isBlocked
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        Delete account
      </button>

      {/* ─── Confirmation modal ─── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="20"
                    height="20"
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete account
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>This cannot be undone.</strong> Your account,
                  memberships, tasks you created, and all related data will be
                  permanently removed.
                </p>
              </div>

              {/* Confirm email */}
              <div>
                <label
                  htmlFor="confirm-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Password (credentials users only) */}
              {hasPassword && (
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || loading}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccountButton;