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

  const workspaceId = params?.id;
  const projectId = params?.projectId;
  const taskId = params?.taskId;

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // -----------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------

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

  const isActive = (href, exact = false) => {
    if (exact) return pathname === href;

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  // -----------------------------------------------------------
  // NAV ITEM
  // -----------------------------------------------------------

  const NavItem = ({ href, icon, children, exact = false, badge }) => {
    const active = isActive(href, exact);

    return (
      <Link
        href={href}
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
          text-sm font-medium transition-all duration-200
          ${
            active
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-500" />
        )}

        <span
          className={`
            flex items-center justify-center w-5 h-5 flex-shrink-0
            transition-colors
            ${
              active
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-200'
            }
          `}
        >
          {icon}
        </span>

        <span className="truncate flex-1">{children}</span>

        {badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  // -----------------------------------------------------------
  // ICONS
  // -----------------------------------------------------------

  const icons = {
    grid: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),

    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
        <path
          d="M9 20v-5h6v5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    users: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="7" r="4" />
        <path
          d="M3 21v-2a6 6 0 0 1 12 0v2"
          strokeLinecap="round"
        />
        <path
          d="M16 3.5a4 4 0 0 1 0 7.5"
          strokeLinecap="round"
        />
        <path
          d="M21 21v-2a6 6 0 0 0-3.5-5.46"
          strokeLinecap="round"
        />
      </svg>
    ),

    folder: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    file: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-2.72 2.72-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V21h-3.84v-.18a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05-2.72-2.72.05-.05A1.7 1.7 0 0 0 5 15a1.7 1.7 0 0 0-1.56-1.04H3v-3.84h.44A1.7 1.7 0 0 0 5 9.08a1.7 1.7 0 0 0-.34-1.88l-.05-.05 2.72-2.72.05.05a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10.3 3.26V3h3.84v.26a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05 2.72 2.72-.05.05a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04H21v3.84h-.44A1.7 1.7 0 0 0 19.4 15Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    chevron: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),

    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),

    logout: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 12H3" strokeLinecap="round" />
        <path
          d="M20 4v16a2 2 0 0 1-2 2h-5"
          strokeLinecap="round"
        />
      </svg>
    ),

    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
      </svg>
    ),
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------

  return (
    <aside
      className="
        w-[270px] flex-shrink-0
        h-screen sticky top-0
        flex flex-col
        bg-white dark:bg-[#0b0d12]
        border-r border-gray-200 dark:border-white/[0.06]
      "
    >
      {/* BRAND */}

      <div className="px-5 py-5 border-b border-gray-200 dark:border-white/[0.06]">
        <Link href="/workspaces" className="flex items-center gap-3 group">
          <div
            className="
              relative w-9 h-9 rounded-xl
              bg-gradient-to-br from-indigo-500 to-violet-600
              text-white flex items-center justify-center
              font-black text-sm
              shadow-lg shadow-indigo-500/20
              group-hover:scale-105 transition-transform
            "
          >
            T

            <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0b0d12]" />
          </div>

          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-white">
              TeamFlow
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              Workspace
            </p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}

      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
        {/* General */}

        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
          General
        </p>

        <div className="space-y-1">
          <NavItem href="/workspaces" exact icon={icons.grid}>
            All Workspaces
          </NavItem>
        </div>

        {/* Workspace context */}

        {workspaceId && (
          <div className="mt-7">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
                Workspace
              </p>
            </div>

            <div className="space-y-1">
              <NavItem
                href={`/workspaces/${workspaceId}`}
                exact
                icon={icons.home}
              >
                Overview
              </NavItem>

              <NavItem
                href={`/workspaces/${workspaceId}/members`}
                exact
                icon={icons.users}
              >
                Members
              </NavItem>
            </div>
          </div>
        )}

        {/* Current project */}

        {workspaceId && projectId && (
          <div className="mt-7">
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
              Current Project
            </p>

            <div
              className="
                mx-2 mb-2 px-3 py-2
                rounded-xl
                bg-gray-50 dark:bg-white/[0.025]
                border border-gray-200 dark:border-white/[0.05]
              "
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />

                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  Current project
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <NavItem
                href={`/workspaces/${workspaceId}/projects/${projectId}`}
                exact
                icon={icons.folder}
              >
                Overview
              </NavItem>

              <NavItem
                href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
                exact
                icon={icons.settings}
              >
                Settings
              </NavItem>
            </div>
          </div>
        )}

        {/* ─── Current task ─── */}
        {workspaceId && projectId && taskId && (
          <div className="mt-7">
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
              Current Task
            </p>

            <div
              className="
                mx-2 mb-2 px-3 py-2
                rounded-xl
                bg-gray-50 dark:bg-white/[0.025]
                border border-gray-200 dark:border-white/[0.05]
              "
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />

                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  Viewing task
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <NavItem
                href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`}
                exact
                icon={icons.file}
              >
                Task details
              </NavItem>

              <NavItem
                href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}#comments`}
                icon={icons.users}
              >
                Comments
              </NavItem>
            </div>
          </div>
        )}

        {/* WORKSPACES */}

        {safeWorkspaces.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
                Your Workspaces
              </p>

              <span className="text-[10px] text-gray-400 dark:text-gray-600">
                {safeWorkspaces.length}
              </span>
            </div>

            <div className="space-y-0.5">
              {safeWorkspaces.slice(0, 8).map((ws) => {
                const isInsideThis =
                  typeof ws?.id === 'string' &&
                  pathname.startsWith(`/workspaces/${ws.id}`);

                return (
                  <Link
                    key={ws.id}
                    href={`/workspaces/${ws.id}`}
                    className={`
                      group flex items-center gap-2.5
                      px-3 py-2 rounded-xl
                      transition-all duration-200
                      ${
                        isInsideThis
                          ? 'bg-indigo-50 dark:bg-indigo-500/10'
                          : 'hover:bg-gray-100 dark:hover:bg-white/[0.035]'
                      }
                    `}
                  >
                    <span
                      className={`
                        w-7 h-7 rounded-lg
                        flex items-center justify-center
                        text-[10px] font-bold flex-shrink-0
                        ${
                          isInsideThis
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      {getInitials(ws?.name || 'W')}
                    </span>

                    <span
                      className={`
                        truncate flex-1 text-sm
                        ${
                          isInsideThis
                            ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                        }
                      `}
                    >
                      {ws?.name || 'Unnamed workspace'}
                    </span>

                    {ws?.role === 'OWNER' && (
                      <span
                        className="
                          text-[8px] font-bold
                          px-1.5 py-0.5 rounded-md
                          bg-amber-100 dark:bg-amber-500/10
                          text-amber-700 dark:text-amber-400
                        "
                      >
                        OWNER
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {safeWorkspaces.length > 8 && (
              <button
                type="button"
                className="
                  w-full mt-2 px-3 py-2
                  text-xs text-left
                  text-gray-500 dark:text-gray-500
                  hover:text-gray-800 dark:hover:text-gray-300
                  transition-colors
                "
              >
                + {safeWorkspaces.length - 8} more workspaces
              </button>
            )}
          </div>
        )}
      </nav>

      {/* USER AREA */}

      <div className="relative p-3 border-t border-gray-200 dark:border-white/[0.06]">
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
              <Link
                href="/settings/profile"
                onClick={() => setUserMenuOpen(false)}
                className="
                  flex items-center gap-3
                  px-3 py-2.5 rounded-xl
                  text-sm text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-white/[0.05]
                  transition-colors
                "
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                  {icons.user}
                </span>

                Profile settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-3
                  px-3 py-2.5 rounded-xl
                  text-sm text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-500/10
                  transition-colors
                "
              >
                <span className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  {icons.logout}
                </span>

                Log out
              </button>
            </div>
          </>
        )}

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
                text-xs font-bold
                flex-shrink-0
              "
            >
              {getInitials(safeUser.name)}
            </div>
          )}

          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {safeUser.name || 'User'}
            </p>

            <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate mt-0.5">
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
            {icons.chevron}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;