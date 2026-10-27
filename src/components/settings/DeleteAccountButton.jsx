
// -------------------------------------------------------------
// DeleteAccountButton - Danger zone account deletion
// -------------------------------------------------------------

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteAccountButton({
  ownedWorkspaceCount,
  hasPassword,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const dialogRef = useRef(null);
  const emailInputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userEmail = session?.user?.email || "";
  const isBlocked = Number(ownedWorkspaceCount) > 0;

  const emailMatches =
    confirmEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  const passwordReady = !hasPassword || password.length > 0;
  const canDelete =
    !isBlocked && !!userEmail && emailMatches && passwordReady;

  const handleClose = () => {
    if (loading) return;

    setIsOpen(false);
    setConfirmEmail("");
    setPassword("");
    setError("");
  };

  const handleOpen = () => {
    if (isBlocked || loading) return;

    setConfirmEmail("");
    setPassword("");
    setError("");
    setIsOpen(true);
  };

  // Focus the email confirmation field after the dialog opens.
  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      emailInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Escape handling.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        handleClose();
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        );

        const items = Array.from(focusable).filter(
          (element) => element.offsetParent !== null,
        );

        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, loading]);

  // Prevent background scrolling while the modal is open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleDelete = async (event) => {
    event.preventDefault();

    if (!canDelete || loading) return;

    setLoading(true);
    setError("");

    try {
      const body = {};
      if (hasPassword) body.password = password;

      const response = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to delete your account. Please try again.");
        return;
      }

      await signOut({ redirect: false });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("[DELETE_ACCOUNT]", err);
      setError("A network error occurred. Please try again.");
    } finally {
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
            ? "Delete or transfer your workspaces first"
            : "Permanently delete your account"
        }
        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ${
          isBlocked
            ? "cursor-not-allowed border-white/[0.06] bg-white/[0.025] text-zinc-600"
            : "border-red-400/20 bg-red-500/[0.08] text-red-300 hover:border-red-400/30 hover:bg-red-500/[0.14] active:scale-[0.98]"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Delete account
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="delete-account-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) handleClose();
            }}
          >
            <motion.section
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              aria-describedby="delete-account-description"
              className="relative my-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0e0f13] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-red-500/[0.09] to-transparent" />

              <header className="relative flex items-center gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-500/[0.09] text-red-300">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.8-3l-8.5-14.1a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <h2 id="delete-account-title" className="text-sm font-semibold text-white">
                    Delete account
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Permanently remove your account
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  aria-label="Close dialog"
                  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="m18 6-12 12M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </header>

              <form onSubmit={handleDelete}>
                <div className="relative space-y-5 p-5 sm:p-6">
                  <div
                    id="delete-account-description"
                    className="rounded-xl border border-red-400/15 bg-red-500/[0.055] p-4"
                  >
                    <p className="text-[13px] font-medium text-red-200">
                      This action cannot be undone.
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                      Your account and associated data may be permanently
                      removed. Review any workspace or project data you need
                      before continuing.
                    </p>
                  </div>

                  {isBlocked && (
                    <p role="alert" className="text-xs leading-5 text-red-300">
                      You own {ownedWorkspaceCount} workspace
                      {ownedWorkspaceCount === 1 ? "" : "s"}. Transfer ownership
                      or delete those workspaces before deleting your account.
                    </p>
                  )}

                  {error && (
                    <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/[0.07] px-3.5 py-3">
                      <p className="text-xs leading-5 text-red-300">{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="confirm-delete-email" className="mb-2 block text-xs font-medium text-zinc-300">
                      Confirm your email address
                    </label>
                    <p className="mb-2 break-all font-mono text-xs text-zinc-500">
                      {userEmail || "Email unavailable"}
                    </p>
                    <input
                      ref={emailInputRef}
                      id="confirm-delete-email"
                      type="email"
                      value={confirmEmail}
                      onChange={(event) => setConfirmEmail(event.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      disabled={loading || isBlocked || !userEmail}
                      aria-invalid={confirmEmail.length > 0 && !emailMatches}
                      required
                      className="w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-red-400/50 focus:ring-2 focus:ring-red-500/10 disabled:opacity-50"
                    />
                    {confirmEmail.length > 0 && !emailMatches && (
                      <p className="mt-1.5 text-[11px] text-red-300">
                        The email address does not match your account.
                      </p>
                    )}
                  </div>

                  {hasPassword && (
                    <div>
                      <label htmlFor="confirm-delete-password" className="mb-2 block text-xs font-medium text-zinc-300">
                        Account password
                      </label>
                      <input
                        id="confirm-delete-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={loading || isBlocked}
                        required
                        className="w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-red-400/50 focus:ring-2 focus:ring-red-500/10 disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>

                <footer className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-black/15 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!canDelete || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-red-400 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.06] disabled:text-zinc-500"
                  >
                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Deleting account…
                      </>
                    ) : (
                      "Delete permanently"
                    )}
                  </button>
                </footer>
              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
