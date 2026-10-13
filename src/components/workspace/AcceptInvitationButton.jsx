// -------------------------------------------------------------
// AcceptInvitationButton - Client-side accept action
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by the /invite/[token] page when the user is
//   logged in with the email the invitation was sent to.
//
// STRUCTURE:
//   Error alert (glass, role=alert)
//   Full-width primary button
//
// POLISH:
//   - Glass red error surface (matches TaskDetailModal)
//   - Button gets spinner + "Joining…"
//   - Framer Motion crossfade on the alert
//   - active:scale-[0.98] on the button
//   - aria-live on the error, aria-busy on the button
//
// PRESERVED:
//   - Same props (token)
//   - Same state (loading, error)
//   - Same handler (handleAccept)
//   - Same API endpoint
//   - Same redirect on success
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const AcceptInvitationButton = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation');
        setLoading(false);
        return;
      }

      // Success → jump to the workspace.
      router.push(`/workspaces/${data.workspace.id}`);
      router.refresh();
    } catch (err) {
      console.error('[ACCEPT_INVITE]', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ══════════ ERROR ══════════ */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="alert"
            aria-live="polite"
            className="
              rounded-xl px-3.5 py-3
              bg-red-500/[0.07] dark:bg-red-500/10
              border border-red-500/20
            "
          >
            <p className="text-[12.5px] text-red-700 dark:text-red-300">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ BUTTON ══════════ */}
      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        aria-busy={loading}
        className="
          w-full py-3 rounded-xl
          bg-indigo-600 hover:bg-indigo-700
          disabled:bg-indigo-400 dark:disabled:bg-indigo-800
          disabled:cursor-not-allowed
          active:scale-[0.98]
          text-white text-[13px] font-medium
          transition-all duration-150
          inline-flex items-center justify-center gap-2
        "
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Joining…
          </>
        ) : (
          'Accept invitation'
        )}
      </button>
    </div>
  );
};

export default AcceptInvitationButton;