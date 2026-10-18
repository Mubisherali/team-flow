// -------------------------------------------------------------
// Sidebar - Left navigation for the dashboard
// -------------------------------------------------------------
//
// PHASE 11 (Fix):
//   - Remembers the last active workspace when navigating
//     to global pages like /my-tasks or /invitations.
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

import WorkspaceSwitcher from './WorkspaceSwitcher';
import ModuleCard from './ModuleCard';
import NotificationBell from './NotificationBell';
import NotificationToggleItems from './NotificationToggle';
import { useSidebarModules } from '@/hooks/useSidebarModules';
import { useSidebarStats } from '@/hooks/useSidebarStats';

const Sidebar = ({ user, workspaces = [], onClose }) => {
  const safeUser = user || {};
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  const pathname = usePathname() || '';
  const router = useRouter();
  const params = useParams() || {};

  // ─── 1. Track the active workspace context ───
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  useEffect(() => {
    const urlWorkspaceId = params?.id;
    
    if (urlWorkspaceId) {
      // We are in a workspace. Save it as the last active.
      setActiveWorkspaceId(urlWorkspaceId);
      localStorage.setItem('lastActiveWorkspaceId', urlWorkspaceId);
    } else {
      // We are on a global page (like /my-tasks). Load the last active.
      const saved = localStorage.getItem('lastActiveWorkspaceId');
      // Only use it if the user is still a member of it
      if (saved && safeWorkspaces.some(w => w.id === saved)) {
        setActiveWorkspaceId(saved);
      } else if (safeWorkspaces.length > 0) {
        // Fallback to their first workspace if the saved one is gone
        setActiveWorkspaceId(safeWorkspaces[0].id);
      }
    }
  }, [params?.id, safeWorkspaces]);

  const projectId = params?.projectId;
  const taskId = params?.taskId;

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ─── Fetch stats for the current context ───
  const stats = useSidebarStats({ workspaceId: activeWorkspaceId, projectId });

  // ─── Compute modules from context ───
  const modules = useSidebarModules({
    workspaceId: activeWorkspaceId,
    projectId,
    taskId,
    stats,
  });

  // ─── Helpers ───
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  // ─── Dashboard link active state ───
  const isOnDashboard =
    pathname === '/workspaces' ||
    (activeWorkspaceId && !projectId && !taskId && pathname === `/workspaces/${activeWorkspaceId}`);

  return (
    <aside
      className="
        w-full h-full
        flex flex-col
        bg-white dark:bg-[#0b0d12]
        lg:w-[270px] lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0
        lg:border-r lg:border-gray-200 lg:dark:border-white/[0.06]
      "
    >
      {/* ─── BRAND ROW ─── */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06]">
        <Link
          href="/workspaces"
          onClick={() => onClose?.()}
          className="flex items-center gap-2.5 group min-w-0"
        >
          {/* Logo */}
          <img
            src="/logo.png"
            alt="TeamFlow"
            width={36}
            height={36}
            className="rounded-lg flex-shrink-0"
          />

          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-tight text-gray-900 dark:text-white truncate">
              TeamFlow
            </p>
            <p className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-wider truncate">
              Workspace
            </p>
          </div>
        </Link>

        {/* Close button — mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="
              lg:hidden
              w-8 h-8 flex items-center justify-center
              rounded-lg flex-shrink-0
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-white/[0.06]
              transition-colors
            "
            aria-label="Close menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {/* Workspace switcher */}
        <WorkspaceSwitcher workspaces={safeWorkspaces} onClose={onClose} />

        {/* Dashboard link */}
        <div className="mt-4">
          <Link
            href="/workspaces"
            onClick={() => onClose?.()}
            className={`
              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-[13px] font-medium transition-all duration-200
              ${
                isOnDashboard
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
              }
            `}
          >
            {isOnDashboard && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-500" />
            )}

            <span
              className={`
                w-5 h-5 flex items-center justify-center flex-shrink-0
                ${
                  isOnDashboard
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                }
              `}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M3 11.5 12 4l9 7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 10.5V20h14v-9.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <span className="truncate flex-1">Dashboard</span>
          </Link>
        </div>

        {/* Active modules */}
        {modules.length > 0 && (
          <div className="mt-7">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
                Active Modules
              </p>
              <span className="text-[10px] text-gray-400 dark:text-gray-600">
                {modules.length}
              </span>
            </div>

            <div className="space-y-1">
              {modules.map((mod) => (
                <div key={mod.key} onClick={() => onClose?.()}>
                  <ModuleCard
                    href={mod.href}
                    name={mod.name}
                    subtext={mod.subtext}
                    icon={mod.icon}
                    iconBg={mod.iconBg}
                    exact={mod.exact}
                    badge={mod.badge}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ─── SHORTCUTS HINT ─── */}
      <div className="hidden lg:block px-3 pt-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-shortcuts'))}
          className="
            w-full flex items-center justify-between gap-2
            px-2.5 py-2 rounded-xl
            text-[12px] font-medium
            text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-white/[0.04]
            hover:text-gray-900 dark:hover:text-white
            transition-all duration-150
            group
          "
        >
          <span className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" strokeLinecap="round" />
            </svg>
            Shortcuts
          </span>
          <kbd className="
            px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] 
            border border-gray-200 dark:border-white/[0.08]
            text-[10px] text-gray-400
          ">
            ?
          </kbd>
        </button>
      </div>

      {/* ─── NOTIFICATION BELL (desktop only) ─── */}
      <div className="hidden lg:block px-3 pt-1 pb-1">
        <NotificationBell />
      </div>

      {/* ─── USER AREA ─── */}
      <div className="relative p-3 pt-2 lg:pt-1 border-t border-gray-200 dark:border-white/[0.06] lg:border-t-0">
        {/* User dropdown */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setUserMenuOpen(false)}
            />

            <div
              className="
                absolute bottom-[calc(100%-4px)] left-3 right-3 z-40
                overflow-hidden
                rounded-2xl
                bg-white dark:bg-[#111318]
                border border-gray-200 dark:border-white/[0.08]
                shadow-2xl shadow-black/20 dark:shadow-black/50
                p-1.5
              "
            >
              {/* Notification preferences */}
              <NotificationToggleItems />

              {/* Divider */}
              <div className="my-1 border-t border-gray-100 dark:border-white/[0.06]" />

              <Link
                href="/settings/profile"
                onClick={() => {
                  setUserMenuOpen(false);
                  onClose?.();
                }}
                className="
                  flex items-center gap-3
                  px-3 py-2 rounded-xl
                  text-[13px] text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-white/[0.05]
                  transition-colors
                "
              >
                <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
                  </svg>
                </span>
                Profile settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-3
                  px-3 py-2 rounded-xl
                  text-[13px] text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-500/10
                  transition-colors
                "
              >
                <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M10 17l5-5-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M15 12H3" strokeLinecap="round" />
                    <path
                      d="M20 4v16a2 2 0 0 1-2 2h-5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Log out
              </button>
            </div>
          </>
        )}

        {/* User button */}
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="
            group w-full flex items-center gap-3
            p-2 rounded-xl
            hover:bg-gray-100 dark:hover:bg-white/[0.04]
            transition-all duration-200
          "
        >
          {safeUser.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeUser.image}
              alt={safeUser.name || 'User'}
              className="
                w-9 h-9 rounded-xl
                object-cover flex-shrink-0
                ring-2 ring-white dark:ring-[#0b0d12]
              "
            />
          ) : (
            <div
              className="
                w-9 h-9 rounded-xl
                bg-gradient-to-br from-indigo-500 to-violet-600
                text-white
                flex items-center justify-center
                text-[11px] font-bold
                flex-shrink-0
              "
            >
              {getInitials(safeUser.name)}
            </div>
          )}

          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
              {safeUser.name || 'User'}
            </p>
            <p className="text-[10.5px] text-gray-500 dark:text-gray-500 truncate mt-0.5">
              {safeUser.email || 'Account'}
            </p>
          </div>

          <span
            className={`
              w-5 h-5 flex items-center justify-center
              text-gray-400
              transition-transform duration-200
              ${userMenuOpen ? 'rotate-180' : ''}
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
      </div>
    </aside>
  );
};

export default Sidebar;