// -------------------------------------------------------------
// Sidebar - Left navigation for the dashboard
// -------------------------------------------------------------
//
// DEFENSIVE PROPS:
// We default `workspaces` to [] so that if the parent ever
// passes undefined (hot-reload races, missing prop), the
// .length / .map calls don't crash.
//
// CONTEXTUAL LINKS:
// useParams() gives us the workspace id when we're inside a
// workspace route. Otherwise it's undefined, and contextual
// links are hidden.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

const Sidebar = ({ user, workspaces }) => {
  // ─── Defensive defaults ───
  // Prevents "Cannot read properties of undefined" crashes.
  const safeUser = user || {};
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  const pathname = usePathname() || '';
  const router = useRouter();
  const params = useParams() || {};
  const workspaceId = params.id; // string | undefined
const projectId = params?.projectId; // present when on /workspaces/[id]/projects/[projectId]/...
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // -----------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------
  const isActive = (href) => {
    if (href === '/workspaces') {
      return pathname === href || pathname.startsWith(href + '/');
    }
    return pathname === href;
  };

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
  // RENDER
  // -----------------------------------------------------------
  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-screen sticky top-0">
      {/* ----- Logo / Brand ----- */}
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/workspaces"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
        >
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black">
            T
          </span>
          TeamFlow
        </Link>
      </div>

      {/* ----- Main nav ----- */}
      <nav className="flex-1 overflow-y-auto p-3">
        <Link
          href="/workspaces"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/workspaces'
              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          All Workspaces
        </Link>

        {/* ----- Contextual links: only when inside a workspace ----- */}
       {/* ----- Contextual links: only when inside a workspace ----- */}
{workspaceId && (
  <div className="mt-4">
    <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      Workspace
    </p>

    <Link
      href={`/workspaces/${workspaceId}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === `/workspaces/${workspaceId}`
          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Overview
    </Link>

    <Link
      href={`/workspaces/${workspaceId}/members`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === `/workspaces/${workspaceId}/members`
          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
      Members
    </Link>

    {/* Show "Current project" shortcut when inside a project route */}
    {projectId && (
      <>
        <p className="px-3 mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Current project
        </p>
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === `/workspaces/${workspaceId}/projects/${projectId}`
              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Overview
        </Link>
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === `/workspaces/${workspaceId}/projects/${projectId}/settings`
              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .69.41 1.29 1 1.51H21a2 2 0 110 4h-.09c-.59.22-1 .82-1 1.51z" />
          </svg>
          Settings
        </Link>
      </>
    )}
  </div>
)}

        {/* ----- Workspace list ----- */}
        {safeWorkspaces.length > 0 && (
          <div className="mt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Your workspaces
            </p>
            <ul className="space-y-0.5">
              {safeWorkspaces.slice(0, 8).map((ws) => {
                const isInsideThis =
                  typeof ws?.id === 'string' &&
                  pathname.startsWith(`/workspaces/${ws.id}`);

                return (
                  <li key={ws.id}>
                    <Link
                      href={`/workspaces/${ws.id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        isInsideThis
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.role === 'OWNER' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex-shrink-0 ml-2">
                          OWNER
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {safeWorkspaces.length > 8 && (
              <p className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                + {safeWorkspaces.length - 8} more
              </p>
            )}
          </div>
        )}
      </nav>

      {/* ----- User menu (bottom) ----- */}
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

        {/* Dropdown */}
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

export default Sidebar;