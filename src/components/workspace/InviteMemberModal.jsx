// -------------------------------------------------------------
// InviteMemberModal - Invite a new member to a workspace
// -------------------------------------------------------------
//
// WHEN USED:
//   Opened from the workspace members page by an OWNER or
//   MANAGER. MEMBERs never see the trigger.
//
// STRUCTURE:
//   Backdrop (animated)
//     - Modal card (animated)
//         - Header (title + close)
//         - Body (form state  OR  success state)
//   Inner form/success crossfade via AnimatePresence.
//
// POLISH:
//   - Framer Motion entry + exit (backdrop + card)
//   - Glass surfaces for error / success / warning
//   - Soft indigo focus ring on inputs
//   - Body scroll lock while open
//   - Success state gets a soft emerald check badge
//   - Active-scale on all buttons
//   - A11y: role=dialog, aria-modal, aria-labelledby, alerts
//
// PRESERVED:
//   - Same props
//   - Same state (form / errors / serverError / loading /
//     success / copied)
//   - Zod validation via createInvitationSchema
//   - Success shape { email, inviteLink, warning }
//   - Esc closes (respects loading)
//   - Backdrop click closes (respects loading)
//   - Auto-focus email on open
//   - router.refresh() + onInvited?.() after success
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
      setTimeout(() => emailRef.current?.focus(), 100);
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

  // ─── Lock body scroll while open ───
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

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
    setTimeout(() => emailRef.current?.focus(), 100);
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="invite-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            p-3 sm:p-4
            bg-black/50 dark:bg-black/70
            backdrop-blur-sm
          "
          onClick={() => !loading && onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
        >
          {/* ─── Modal card ─── */}
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
              max-h-[92vh]
              flex flex-col
              overflow-hidden
            "
          >
            {/* ══════════ HEADER ══════════ */}
            <div
              className="
                flex items-center justify-between
                px-5 py-4
                border-b border-gray-200 dark:border-white/[0.06]
                flex-shrink-0
              "
            >
              <h2
                id="invite-modal-title"
                className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Invite to workspace
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
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
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ══════════ BODY ══════════ */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                {success ? (
                  // ========== SUCCESS STATE ==========
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="p-5 sm:p-6 space-y-4"
                  >
                    {/* Success header with check badge */}
                    <div className="flex items-start gap-3">
                      <div
                        className="
                          w-9 h-9 rounded-full flex-shrink-0
                          bg-emerald-500/10 dark:bg-emerald-500/[0.15]
                          flex items-center justify-center
                        "
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-emerald-600 dark:text-emerald-400"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                          Invitation sent
                        </p>
                        <p className="text-[12.5px] text-gray-500 dark:text-gray-400 truncate">
                          {success.email}
                        </p>
                      </div>
                    </div>

                    {/* Warning (if email delivery had an issue) */}
                    {success.warning && (
                      <div
                        className="
                          rounded-xl px-3.5 py-2.5
                          bg-amber-500/[0.07] dark:bg-amber-500/10
                          border border-amber-500/20
                        "
                      >
                        <p className="text-[12px] text-amber-700 dark:text-amber-300">
                          {success.warning}
                        </p>
                      </div>
                    )}

                    {/* Invitation link */}
                    <div>
                      <label
                        htmlFor="invite-link"
                        className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        Invitation link
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="invite-link"
                          readOnly
                          value={success.inviteLink}
                          onFocus={(e) => e.target.select()}
                          className="
                            flex-1 min-w-0
                            px-3 py-2 rounded-lg
                            border border-gray-200 dark:border-white/[0.08]
                            bg-gray-50 dark:bg-white/[0.03]
                            text-[11.5px] font-mono
                            text-gray-700 dark:text-gray-300
                            focus:outline-none
                            focus:border-indigo-500 dark:focus:border-indigo-500/60
                            transition-colors duration-150
                          "
                        />
                        <button
                          type="button"
                          onClick={handleCopy}
                          aria-label={
                            copied
                              ? 'Invitation link copied'
                              : 'Copy invitation link'
                          }
                          className={`
                            px-3 py-2 rounded-lg flex-shrink-0
                            text-[12px] font-medium
                            active:scale-[0.98]
                            transition-all duration-150
                            inline-flex items-center gap-1.5
                            ${
                              copied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }
                          `}
                        >
                          {copied ? (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                aria-hidden="true"
                              >
                                <path
                                  d="M20 6L9 17l-5-5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Copied
                            </>
                          ) : (
                            'Copy'
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                        Share this link if the email doesn&apos;t arrive.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleInviteAnother}
                        className="
                          flex-1 py-2.5 rounded-xl
                          border border-gray-300 dark:border-white/[0.08]
                          text-gray-700 dark:text-gray-300
                          text-[13px] font-medium
                          hover:bg-gray-50 dark:hover:bg-white/[0.04]
                          active:scale-[0.98]
                          transition-all duration-150
                        "
                      >
                        Invite another
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="
                          flex-1 py-2.5 rounded-xl
                          bg-indigo-600 hover:bg-indigo-700
                          text-white text-[13px] font-medium
                          active:scale-[0.98]
                          transition-all duration-150
                        "
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  // ========== FORM STATE ==========
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="p-5 sm:p-6 space-y-4"
                  >
                    {serverError && (
                      <div
                        role="alert"
                        className="
                          rounded-xl px-3.5 py-3
                          bg-red-500/[0.07] dark:bg-red-500/10
                          border border-red-500/20
                        "
                      >
                        <p className="text-[12.5px] text-red-700 dark:text-red-300">
                          {serverError}
                        </p>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="invite-email"
                        className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
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
                        aria-invalid={!!errors.email}
                        aria-describedby={
                          errors.email ? 'invite-email-error' : undefined
                        }
                        className={`
                          w-full px-3 py-2.5 rounded-xl
                          text-[13px]
                          bg-white dark:bg-white/[0.03]
                          text-gray-900 dark:text-white
                          placeholder-gray-400 dark:placeholder-gray-500
                          border transition-all duration-150
                          focus:outline-none
                          focus:ring-2 focus:ring-indigo-500/20
                          ${
                            errors.email
                              ? 'border-red-300 dark:border-red-500/40'
                              : 'border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-500/60'
                          }
                        `}
                      />
                      {errors.email && (
                        <p
                          id="invite-email-error"
                          className="text-[11px] text-red-600 dark:text-red-400 mt-1.5"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label
                        htmlFor="invite-role"
                        className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        Role
                      </label>
                      <select
                        id="invite-role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="
                          w-full px-3 py-2.5 rounded-xl
                          text-[13px]
                          bg-white dark:bg-white/[0.03]
                          text-gray-900 dark:text-white
                          border border-gray-200 dark:border-white/[0.08]
                          focus:outline-none
                          focus:ring-2 focus:ring-indigo-500/20
                          focus:border-indigo-500 dark:focus:border-indigo-500/60
                          transition-all duration-150
                        "
                      >
                        <option value="MEMBER">
                          Member — works on assigned tasks
                        </option>
                        <option value="MANAGER">
                          Manager — can manage projects and invite members
                        </option>
                      </select>
                      {errors.role && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 mt-1.5">
                          {errors.role}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
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
                        type="submit"
                        disabled={loading}
                        className="
                          flex-1 py-2.5 rounded-xl
                          bg-indigo-600 hover:bg-indigo-700
                          disabled:bg-indigo-400 dark:disabled:bg-indigo-800
                          disabled:cursor-not-allowed
                          text-white text-[13px] font-medium
                          active:scale-[0.98]
                          transition-all duration-150
                          inline-flex items-center justify-center gap-2
                        "
                      >
                        {loading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Sending…
                          </>
                        ) : (
                          'Send invitation'
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InviteMemberModal;