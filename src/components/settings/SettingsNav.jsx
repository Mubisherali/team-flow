
// -------------------------------------------------------------
// SettingsNav - Settings sub-navigation
// -------------------------------------------------------------

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/settings/profile",
    label: "Profile",
    description: "Your personal information",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
      </svg>
    ),
    enabled: true,
  },
  {
    href: "/settings/appearance",
    label: "Appearance",
    description: "Theme and display preferences",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18m0-9h9" strokeLinecap="round" />
      </svg>
    ),
    enabled: false,
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    description: "Manage your alerts",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 21h4" strokeLinecap="round" />
      </svg>
    ),
    enabled: false,
  },
];

export default function SettingsNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Settings sections"
      className="min-w-0"
    >
      <div className="mb-3 hidden px-3 md:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-600">
          Preferences
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          const itemClasses = `group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 ${
            isActive
              ? "border border-violet-400/15 bg-violet-500/[0.09] text-violet-200"
              : item.enabled
                ? "border border-transparent text-zinc-400 hover:bg-white/[0.035] hover:text-zinc-200"
                : "border border-transparent text-zinc-600"
          }`;

          const content = (
            <>
              {isActive && (
                <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-violet-400 md:block" aria-hidden="true" />
              )}

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isActive
                    ? "border-violet-400/15 bg-violet-400/[0.1] text-violet-200"
                    : "border-white/[0.055] bg-white/[0.025] text-zinc-500 group-hover:text-zinc-300"
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span className="min-w-0">
                <span className="block whitespace-nowrap text-xs font-medium">
                  {item.label}
                </span>
                <span className="mt-1 hidden whitespace-nowrap text-[10px] text-zinc-600 md:block">
                  {item.description}
                </span>
              </span>

              {!item.enabled && (
                <span className="ml-auto hidden rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[9px] text-zinc-600 md:inline-flex">
                  Soon
                </span>
              )}
            </>
          );

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                title={`${item.label} — coming soon`}
                className={`${itemClasses} cursor-not-allowed`}
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={itemClasses}
            >
              {content}
            </Link>
          );
        })}
      </div>

      <div className="mt-5 hidden rounded-xl border border-white/[0.055] bg-white/[0.015] p-3 md:block">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 text-[9px] font-bold text-violet-300">
            TF
          </span>
          <span className="text-[10px] font-medium tracking-wide text-zinc-500">
            TEAMFLOW SETTINGS
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-zinc-600">
          Manage your account and personalize your workspace experience.
        </p>
      </div>
    </nav>
  );
}
