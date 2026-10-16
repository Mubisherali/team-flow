// -------------------------------------------------------------
// WorkspaceSwitcher - Dropdown to switch between workspaces
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered in the sidebar. Reads current workspace from URL.
//
// STRUCTURE:
//   Trigger button (avatar + name + role + chevron)
//     - Dropdown (AnimatePresence)
//       - List of workspaces
//       - Divider
//       - "All Workspaces" link
//
// POLISH:
//   - Dropdown gets AnimatePresence (fade + scale + y)
//   - Trigger gets focus ring + aria-expanded + aria-haspopup
//   - Items get focus-visible rings
//   - aria-current="true" on current workspace
//   - Globe SVG replaces emoji fallback (consistent rendering)
//   - Transitions normalized to duration-150/200
//
// PRESERVED:
//   - Props (workspaces)
//   - All state (open, refs)
//   - Outside click / Escape / route change close handlers
//   - initials() helper
//   - Navigation behavior
//   - Dropdown surface #111318 (elevated pattern)
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const WorkspaceSwitcher = ({ workspaces }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const pathname = usePathname() || '';
  const router = useRouter();
  const params = useParams() || {};
  const workspaceId = params?.id;

  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  // Current workspace (if inside one)
  const current = workspaceId
    ? safeWorkspaces.find((w) => w.id === workspaceId)
    : null;

  // ─── Close on outside click ───
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ─── Close on Escape ───
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // ─── Close on route change ───
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ─── Get initials ───
  const initials = (name) => {
    if (!name) return 'W';
    return name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative" ref={wrapRef}>
      {/* ─── Trigger ─── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`
          w-full flex items-center gap-3
          px-3 py-2.5 rounded-xl
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          active:scale-[0.99]
          transition-all duration-150
          ${
            open
              ? 'bg-gray-100 dark:bg-white/[0.06]'
              : 'hover:bg-gray-100 dark:hover:bg-white/[0.04]'
          }
        `}
      >
        {/* Avatar tile */}
        <span
          className={`
            w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
            text-[11px] font-bold
            transition-colors duration-150
            ${
              current
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-gray-200 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400'
            }
          `}
          aria-hidden="true"
        >
          {current ? (
            initials(current.name)
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          )}
        </span>

        {/* Text */}
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-[13px] font-semibold text-gray-900 dark:text-white truncate">
            {current ? current.name : 'All Workspaces'}
          </span>
          <span className="block text-[10.5px] text-gray-500 dark:text-gray-500 truncate mt-0.5 uppercase tracking-wider">
            {current ? `Workspace · ${current.role}` : 'Personal'}
          </span>
        </span>

        {/* Chevron */}
        <span
          aria-hidden="true"
          className={`
            w-4 h-4 flex items-center justify-center flex-shrink-0
            text-gray-400
            transition-transform duration-200
            ${open ? 'rotate-180' : ''}
          `}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="m6 9 6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* ─── Dropdown ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="switcher-dropdown"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -2 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            className="
              absolute top-full left-0 right-0 mt-2 z-40
              rounded-2xl overflow-hidden
              bg-white dark:bg-[#111318]
              border border-gray-200 dark:border-white/[0.08]
              shadow-2xl shadow-black/20 dark:shadow-black/50
              p-1.5
            "
          >
            {safeWorkspaces.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
                  Your Workspaces
                </p>

                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {safeWorkspaces.map((ws) => {
                    const isCurrent = ws.id === workspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        role="menuitem"
                        aria-current={isCurrent ? 'true' : undefined}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/workspaces/${ws.id}`);
                        }}
                        className={`
                          w-full flex items-center gap-2.5
                          px-3 py-2 rounded-xl
                          text-left
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                          active:scale-[0.99]
                          transition-all duration-150
                          ${
                            isCurrent
                              ? 'bg-indigo-500/10 dark:bg-indigo-500/10'
                              : 'hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                          }
                        `}
                      >
                        <span
                          className={`
                            w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                            text-[10px] font-bold
                            ${
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400'
                            }
                          `}
                          aria-hidden="true"
                        >
                          {initials(ws.name)}
                        </span>

                        <span className="flex-1 min-w-0">
                          <span
                            className={`
                              block text-[13px] truncate
                              ${
                                isCurrent
                                  ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                                  : 'text-gray-700 dark:text-gray-300'
                              }
                            `}
                          >
                            {ws.name}
                          </span>
                          <span className="block text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                            {ws.role}
                          </span>
                        </span>

                        {isCurrent && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                            aria-hidden="true"
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="my-1 border-t border-gray-100 dark:border-white/[0.06]" />
              </>
            )}

            {/* All Workspaces */}
            <Link
              href="/workspaces"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="
                flex items-center gap-2.5
                px-3 py-2 rounded-xl
                text-[13px] text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-white/[0.04]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                active:scale-[0.99]
                transition-all duration-150
              "
            >
              <span
                className="
                  w-7 h-7 rounded-lg flex-shrink-0
                  bg-gray-100 dark:bg-white/[0.06]
                  flex items-center justify-center
                "
                aria-hidden="true"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              All Workspaces
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSwitcher;