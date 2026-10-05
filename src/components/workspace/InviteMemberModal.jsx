// -------------------------------------------------------------
// InviteMemberModal - Invite a new member to a workspace
// -------------------------------------------------------------
//
// USAGE:
//   <InviteMemberModal
//     isOpen={isOpen}
//     onClose={() => setIsOpen(false)}
//     workspaceId={workspaceId}
//     onInvited={() => router.refresh()}
//   />
//
// FLOW:
//   1. User types email + picks role
//   2. Client validates with Zod
//   3. POST /api/workspaces/[id]/invitations
//   4. Success state shows the invite link with a copy button
//      → so the owner can share it manually if email fails
//   5. "Invite another" resets the form (stay open)
//   6. "Done" closes the modal
//
// WHY TWO STATES (form / success):
// The email may or may not arrive (Resend limits, spam, etc.).
// Showing the link right after creation gives the owner a
// fallback path without leaving the modal.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { createInvitationSchema } from '@/lib/validators/invitation';

const InviteMemberModal = ({ isOpen, onClose, workspaceId, onInvited }) => {
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  // success shape:
  //   { email, inviteLink, warning? }

  const [copied, setCopied] = useState(false);

  const emailRef = useRef(null);
  const router = useRouter();

  // ─── Reset state when the modal opens ───
  useEffect(() => {
    if (isOpen) {
      setForm({ email: '', role: 'MEMBER' });
      setErrors({});
      setServerError('');
      setSuccess(null);
      setLoading(false);
      setCopied(false);
      // Focus the email field for fast typing.
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ─── ESC closes the modal ───
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, loading, onClose]);

  // ─── Input change ───
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  // ─── Submit ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    // Client-side validation
    const parsed = createInvitationSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to send invitation');
        setLoading(false);
        return;
      }

      setSuccess({
        email: data.invitation.email,
        inviteLink: data.inviteLink,
        warning: data.warning,
      });
      setLoading(false);

      // Tell the parent to refresh (list updates).
      onInvited?.();
      router.refresh();
    } catch (err) {
      console.error('[INVITE_MEMBER]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // ─── Copy invite link to clipboard ───
  const handleCopy = async () => {
    if (!success?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(success.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('[COPY_FAILED]', err);
    }
  };

  // ─── Reset to invite another ───
  const handleInviteAnother = () => {
    setForm({ email: '', role: 'MEMBER' });
    setErrors({});
    setServerError('');
    setSuccess(null);
    setCopied(false);
    setTimeout(() => emailRef.current?.focus(), 50);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Invite to workspace
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ─── Body ─── */}
        {success ? (
          // ========== SUCCESS STATE ==========
          <div className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-300">
                Invitation sent to <strong>{success.email}</strong>
              </p>
            </div>

            {success.warning && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {success.warning}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invitation link
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={success.inviteLink}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Share this link if the email doesn&apos;t arrive.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleInviteAnother}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Invite another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // ========== FORM STATE ==========
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            {serverError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {serverError}
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email address
              </label>
              <input
                ref={emailRef}
                id="invite-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="teammate@company.com"
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="invite-role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Role
              </label>
              <select
                id="invite-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MEMBER">
                  Member — works on assigned tasks
                </option>
                <option value="MANAGER">
                  Manager — can manage projects and invite members
                </option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-600 mt-1">{errors.role}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium transition-colors"
              >
                {loading ? 'Sending...' : 'Send invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;