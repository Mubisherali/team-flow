// -------------------------------------------------------------
// InvitationsList — Animated client-side invitation list
// -------------------------------------------------------------

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import InviteCard from "./InviteCard";

export default function InvitationsList({ initialInvitations = [] }) {
  const [invitations, setInvitations] = useState(initialInvitations);

  const handleAccepted = (invitation) => {
    setInvitations((previous) =>
      previous.filter((item) => item.id !== invitation.id)
    );
  };

  const handleDeclined = (invitation) => {
    setInvitations((previous) =>
      previous.filter((item) => item.id !== invitation.id)
    );
  };

  if (invitations.length === 0) {
    return <EmptyInvitations />;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false} mode="popLayout">
        {invitations.map((invitation, index) => (
          <motion.div
            key={invitation.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              x: 16,
              scale: 0.985,
              transition: { duration: 0.18, ease: "easeOut" },
            }}
            transition={{
              duration: 0.28,
              delay: Math.min(index * 0.045, 0.18),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <InviteCard
              invitation={invitation}
              onAccepted={handleAccepted}
              onDeclined={handleDeclined}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// Empty state
// -------------------------------------------------------------
function EmptyInvitations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl border border-dashed border-gray-300/80 bg-gray-50/70 px-5 py-14 text-center dark:border-white/[0.09] dark:bg-white/[0.015] sm:px-8 sm:py-16"
    >
      {/* Subtle decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-emerald-500/[0.06] blur-3xl"
      />

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-600 dark:border-emerald-400/15 dark:bg-emerald-400/[0.07] dark:text-emerald-400">
        <svg
          aria-hidden="true"
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
          <path d="m9 15 2 2 4-4" />
        </svg>

        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-[#0d0e12]">
          <svg
            aria-hidden="true"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </span>
      </div>

      <div className="relative mx-auto mt-5 max-w-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
          All caught up
        </p>

        <h3 className="mt-2 text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
          No pending invitations
        </h3>

        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-6 text-gray-600 dark:text-gray-400">
          You’re all clear for now. When someone invites you to a workspace,
          their invitation will appear here.
        </p>
      </div>

      <div className="relative mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-gray-200/80 bg-white/80 px-3 py-2 text-[11px] text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-gray-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Your workspace access is up to date
      </div>
    </motion.div>
  );
}
