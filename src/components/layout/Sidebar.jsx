
// -------------------------------------------------------------
// Sidebar - Left navigation for the TeamFlow dashboard
// -------------------------------------------------------------
//
// PRESERVED:
//   - WorkspaceSwitcher
//   - useSidebarModules / useSidebarStats
//   - Active workspace persistence
//   - Dashboard active state
//   - ModuleCard props and navigation
//   - Mobile close button
//   - Keyboard shortcuts event
//
// POLISH:
//   - Refined brand header
//   - Cleaner navigation spacing
//   - Premium active states
//   - Subtle hover transitions
//   - Improved scrollbar and focus states
// -------------------------------------------------------------

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

import WorkspaceSwitcher from "./WorkspaceSwitcher";
import ModuleCard from "./ModuleCard";
import { useSidebarModules } from "@/hooks/useSidebarModules";
import { useSidebarStats } from "@/hooks/useSidebarStats";

const Sidebar = ({ user, workspaces = [], onClose }) => {
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  const pathname = usePathname() || "";
  const params = useParams() || {};

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  // Keep workspace context synchronized with the current route.
  useEffect(() => {
    const urlWorkspaceId = params?.id;

    if (urlWorkspaceId) {
      setActiveWorkspaceId(urlWorkspaceId);

      try {
        localStorage.setItem("lastActiveWorkspaceId", urlWorkspaceId);
      } catch {
        // Continue without persistence if storage is unavailable.
      }

      return;
    }

    try {
      const saved = localStorage.getItem("lastActiveWorkspaceId");

      if (saved && safeWorkspaces.some((w) => w.id === saved)) {
        setActiveWorkspaceId(saved);
      } else if (safeWorkspaces.length > 0) {
        setActiveWorkspaceId(safeWorkspaces[0].id);
      } else {
        setActiveWorkspaceId(null);
      }
    } catch {
      setActiveWorkspaceId(safeWorkspaces[0]?.id || null);
    }
  }, [params?.id, safeWorkspaces]);

  const projectId = params?.projectId;
  const taskId = params?.taskId;

  const stats = useSidebarStats({
    workspaceId: activeWorkspaceId,
    projectId,
  });

  const modules = useSidebarModules({
    workspaceId: activeWorkspaceId,
    projectId,
    taskId,
    stats,
  });

  const isOnDashboard =
    pathname === "/workspaces" ||
    Boolean(
      activeWorkspaceId &&
        !projectId &&
        !taskId &&
        pathname === `/workspaces/${activeWorkspaceId}`
    );

  const closeSidebar = () => onClose?.();

  return (
    <aside
      className="
        relative flex h-full w-full flex-col
        overflow-hidden bg-white
        dark:bg-[#0b0d12]
        lg:sticky lg:top-0 lg:h-screen lg:w-[270px]
        lg:flex-shrink-0
        lg:border-r lg:border-gray-200/80
        lg:dark:border-white/[0.07]
      "
    >
      {/* Brand header */}
      <div
        className="
          flex min-h-[65px] items-center justify-between
          border-b border-gray-200/80 px-5 py-3
          dark:border-white/[0.07]
        "
      >
        <Link
          href="/workspaces"
          onClick={closeSidebar}
          className="
            group flex min-w-0 items-center gap-3
            rounded-lg outline-none
            focus-visible:ring-2 focus-visible:ring-indigo-500
          "
          aria-label="TeamFlow home"
        >
          <span
            className="
              relative flex h-9 w-9 shrink-0 items-center
              justify-center overflow-hidden rounded-xl
              bg-indigo-600 shadow-sm shadow-indigo-600/20
              ring-1 ring-inset ring-white/15
              transition-transform duration-200
              group-hover:scale-[1.03]
            "
          >
            <img
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full rounded-xl object-cover"
            />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold tracking-tight text-gray-900 dark:text-white">
              TeamFlow
            </span>
            <span className="mt-0.5 block truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              Workspace platform
            </span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={closeSidebar}
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-lg text-gray-500 transition-colors
              hover:bg-gray-100 hover:text-gray-900
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500
              dark:text-gray-400 dark:hover:bg-white/[0.07]
              dark:hover:text-white
              lg:hidden
            "
            aria-label="Close menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav
        aria-label="Workspace navigation"
        className="
          scrollbar-thin flex-1 overflow-y-auto
          px-3 py-4
        "
      >
        {/* Workspace selector */}
        <div className="mb-5">
          <WorkspaceSwitcher
            workspaces={safeWorkspaces}
            onClose={onClose}
          />
        </div>

        {/* Dashboard */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600">
            Overview
          </p>

          <Link
            href="/workspaces"
            onClick={closeSidebar}
            aria-current={isOnDashboard ? "page" : undefined}
            className={`
              group relative flex items-center gap-3
              rounded-xl px-3 py-2.5
              text-[13px] font-medium
              outline-none transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-indigo-500
              ${
                isOnDashboard
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-950/[0.02] dark:bg-indigo-500/[0.12] dark:text-indigo-300"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/[0.045] dark:hover:text-white"
              }
            `}
          >
            {isOnDashboard && (
              <span
                aria-hidden="true"
                className="
                  absolute bottom-2 left-0 top-2 w-[3px]
                  rounded-r-full bg-indigo-600
                  dark:bg-indigo-400
                "
              />
            )}

            <span
              className={`
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg transition-colors duration-200
                ${
                  isOnDashboard
                    ? "bg-indigo-100/80 text-indigo-600 dark:bg-indigo-500/[0.15] dark:text-indigo-300"
                    : "bg-gray-100/80 text-gray-500 group-hover:text-gray-800 dark:bg-white/[0.035] dark:text-gray-500 dark:group-hover:text-gray-200"
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
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 10.5 9-7 9 7" />
                <path d="M5 9.5V20h14V9.5" />
                <path d="M9 20v-6h6v6" />
              </svg>
            </span>

            <span className="min-w-0 flex-1 truncate">Dashboard</span>

            {isOnDashboard && (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
              />
            )}
          </Link>
        </div>

        {/* Active modules */}
        {modules.length > 0 && (
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600">
                Workspace modules
              </p>

              <span
                className="
                  rounded-md border border-gray-200/80
                  bg-gray-50 px-1.5 py-0.5
                  text-[10px] font-semibold tabular-nums
                  text-gray-500
                  dark:border-white/[0.07]
                  dark:bg-white/[0.035]
                  dark:text-gray-500
                "
              >
                {modules.length}
              </span>
            </div>

            <div className="space-y-1">
              {modules.map((mod) => (
                <div key={mod.key} onClick={closeSidebar}>
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

      {/* Bottom shortcuts */}
      <div
        className="
          hidden border-t border-gray-200/80 px-3 pb-3 pt-3
          dark:border-white/[0.07]
          lg:block
        "
      >
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-shortcuts"))
          }
          className="
            group flex w-full items-center justify-between gap-3
            rounded-xl border border-transparent
            px-3 py-2.5 text-[12px] font-medium
            text-gray-500 transition-all duration-150
            hover:border-gray-200/80 hover:bg-gray-50
            hover:text-gray-900
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-indigo-500
            dark:text-gray-400
            dark:hover:border-white/[0.06]
            dark:hover:bg-white/[0.035]
            dark:hover:text-white
          "
        >
          <span className="flex items-center gap-2.5">
            <span
              className="
                flex h-7 w-7 items-center justify-center
                rounded-lg bg-gray-100 text-gray-500
                transition-colors
                group-hover:bg-indigo-50 group-hover:text-indigo-600
                dark:bg-white/[0.045] dark:text-gray-400
                dark:group-hover:bg-indigo-500/10
                dark:group-hover:text-indigo-300
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
              </svg>
            </span>

            Keyboard shortcuts
          </span>

          <kbd
            className="
              inline-flex h-5 min-w-5 items-center justify-center
              rounded-md border border-gray-200 bg-white px-1.5
              text-[10px] font-semibold text-gray-500
              dark:border-white/[0.09] dark:bg-white/[0.04]
              dark:text-gray-400
            "
          >
            ?
          </kbd>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
