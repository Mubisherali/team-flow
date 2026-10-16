// -------------------------------------------------------------
// InvitationsList - Client wrapper for the invitations page
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by /invitations page. Takes server-fetched
//   invitations and renders InviteCard for each, with an
//   empty state when there are none.
//
// PROPS:
//   initialInvitations : array from the server component
//
// STATE:
//   Tracks removed invite IDs so the list updates instantly
//   after Accept / Decline, without needing a full refetch.
//
// POLISH:
//   - AnimatePresence for smooth removal
//   - Empty state with glass emerald icon
//   - Consistent type scale
//
// PRESERVED:
//   - Server-side data shapes (id, token, workspace, etc.)
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import InviteCard from './InviteCard';

const InvitationsList = ({ initialInvitations = [] }) => {
  const [invitations, setInvitations] = useState(initialInvitations);

  const handleAccepted = (invitation) => {
    // Remove immediately — user redirects to workspace anyway.
    setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
  };

  const handleDeclined = (invitation) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
  };

  if (invitations.length === 0) {
    return <EmptyInvitations />;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {invitations.map((inv) => (
          <InviteCard
            key={inv.id}
            invitation={inv}
            onAccepted={handleAccepted}
            onDeclined={handleDeclined}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// =============================================================
// Empty state
// =============================================================
const EmptyInvitations = () => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="
      rounded-2xl py-16 px-6 text-center
      border border-dashed
      border-gray-300 dark:border-white/[0.08]
      bg-white/60 dark:bg-white/[0.02]
    "
  >
    <div
      className="
        w-14 h-14 mx-auto mb-4 rounded-full
        bg-emerald-500/10 dark:bg-emerald-500/15
        flex items-center justify-center
      "
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-emerald-600 dark:text-emerald-400"
      >
        <path
          d="M20 6L9 17l-5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
      No pending invitations
    </h3>
    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
      When someone invites you to a workspace, you&apos;ll see it here.
    </p>
  </motion.div>
);

export default InvitationsList;