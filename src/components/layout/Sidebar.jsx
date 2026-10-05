// -------------------------------------------------------------
// Sidebar - Left navigation for the dashboard
// -------------------------------------------------------------
//
// STRUCTURE:
//   1. Logo
//   2. All Workspaces (always visible)
//   3. Current workspace context (only when inside one)
//      - Overview
//      - Members
//      - Projects
//   4. Your workspaces (list — always visible)
//   5. User menu (bottom)
//
// DEFENSIVE:
//   - workspaces defaults to [] if undefined
//   - user defaults to {} if undefined
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

const Sidebar = ({ user, workspaces }) => {
  const safeUser = user || {};
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  const pathname = usePathname() || '';
  const router = useRouter();
  const params = useParams() || {};
  const workspaceId = params.id; // present inside a workspace

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Find the current workspace (to show its name in the header)
  const currentWorkspace = workspaceId
    ? safeWorkspaces.find((w) => w.id === workspaceId)
    : null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
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

  // -----------------------------------------------------------
  // Helper: is this href the currently-active nav item?
  // -----------------------------------------------------------
  const isExactly = (href) => pathname === href;
  const isAt = (href) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-screen sticky top-0">
      {/* ─── Logo ─── */}
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/workspaces"
          className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white"
        >
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black">
            T
          </span>
          TeamFlow
        </Link>
      </div>

      {/* ─── Main nav ─── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* All Workspaces */}
        <NavLink
          href="/workspaces"
          active={isExactly('/workspaces')}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          }
        >
          All Workspaces
        </NavLink>

        {/* ─── Current workspace context ─── */}
        {currentWorkspace && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Current
              </p>
            </div>

            <NavLink
              href={`/workspaces/${workspaceId}`}
              active={isExactly(`/workspaces/${workspaceId}`)}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              {currentWorkspace.name}
            </NavLink>

            <SubNavLink
              href={`/workspaces/${workspaceId}/members`}
              active={isExactly(`/workspaces/${workspaceId}/members`)}
            >
              Members
            </SubNavLink>

            <SubNavLink
              href={`/workspaces/${workspaceId}`}
              active={isAt(`/workspaces/${workspaceId}/projects`)}
              disabled
            >
              Projects (view on workspace)
            </SubNavLink>
          </>
        )}

        {/* ─── Divider before workspace list ─── */}
        {safeWorkspaces.length > 0 && (
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Your workspaces
            </p>
          </div>
        )}

        {/* ─── Workspace list (compact) ─── */}
        {safeWorkspaces.slice(0, 6).map((ws) => {
          const isCurrent = ws.id === workspaceId;
          return (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isCurrent
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                  isCurrent ? 'bg-indigo-600' : 'bg-gray-400 dark:bg-gray-600'
                }`}
              >
                {ws.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{ws.name}</span>
            </Link>
          );
        })}

        {safeWorkspaces.length > 6 && (
          <Link
            href="/workspaces"
            className="block px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            + {safeWorkspaces.length - 6} more
          </Link>
        )}
      </nav>

      {/* ─── User menu ─── */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {safeUser.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeUser.image}
              alt={safeUser.name || 'User'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(safeUser.name)}
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {safeUser.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {safeUser.email || ''}
            </p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setUserMenuOpen(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-2 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Profile settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border-t border-gray-200 dark:border-gray-800"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

// =============================================================
// NavLink - main navigation item (bold, larger)
// =============================================================
const NavLink = ({ href, active, icon, children }) => (
  <Link
    href={href}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{children}</span>
  </Link>
);

// =============================================================
// SubNavLink - nested navigation item (indented, lighter)
// =============================================================
const SubNavLink = ({ href, active, children, disabled }) => {
  const base = `flex items-center gap-2 pl-10 pr-3 py-1.5 rounded-lg text-sm transition-colors`;
  const styles = active
    ? 'text-indigo-700 dark:text-indigo-300 font-medium'
    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';

  if (disabled) {
    return (
      <span className={`${base} ${styles} cursor-default`}>{children}</span>
    );
  }

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
};

export default Sidebar;