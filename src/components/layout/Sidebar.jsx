// -------------------------------------------------------------
// Sidebar - Left navigation for the dashboard
// -------------------------------------------------------------
//
// WHY CLIENT COMPONENT ('use client'):
//   - usePathname() to highlight the active route
//   - useState for the user menu dropdown
//   - onClick handlers
//
// PROPS:
//   user       : { id, name, email, image } - current user
//   workspaces : [{ id, name, slug, role }, ...] - user's workspaces
//
// NOTE ON SIGN OUT:
// Uses signOut() from next-auth/react, with redirect: false
// so we can control the navigation ourselves.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

const Sidebar = ({ user, workspaces }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // -----------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------
  // Active-link detection: highlight the nav item if we're on
  // that route or any sub-route.
  const isActive = (href) => {
    if (href === '/workspaces') {
      // Exact match OR nested (e.g., /workspaces/[id])
      return pathname === href || pathname.startsWith(href + '/');
    }
    return pathname === href;
  };

  // Get initials for the user avatar (fallback if no image).
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
            isActive('/workspaces')
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

        {/* ----- Workspace list ----- */}
        {workspaces.length > 0 && (
          <div className="mt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Your workspaces
            </p>
            <ul className="space-y-0.5">
              {workspaces.slice(0, 8).map((ws) => (
                <li key={ws.id}>
                  <Link
                    href={`/workspaces/${ws.id}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname.startsWith(`/workspaces/${ws.id}`)
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
              ))}
            </ul>
            {workspaces.length > 8 && (
              <p className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                + {workspaces.length - 8} more
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
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(user.name)}
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {userMenuOpen && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setUserMenuOpen(false)}
            />
            {/* Menu */}
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