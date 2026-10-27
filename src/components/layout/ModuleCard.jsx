// -------------------------------------------------------------
//
// PRESERVED:
//   - Props: href, icon, iconBg, name, subtext, exact, badge
//   - Exact and nested-route active matching
//   - Link navigation and optional badge
//   - Existing iconBg styling
//
// POLISH:
//   - Premium active state
//   - Refined icon tile and typography
//   - Subtle hover and press animations
//   - Accessible focus ring and aria-current
//   - Consistent with the polished Sidebar
// -------------------------------------------------------------

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ModuleCard = ({
  href,
  icon,
  iconBg,
  name,
  subtext,
  exact = false,
  badge,
}) => {
  const pathname = usePathname() || "";

  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`
        group relative flex min-w-0 items-center gap-3
        rounded-xl border px-3 py-2.5
        outline-none transition-all duration-150 ease-out
        active:scale-[0.99]
        focus-visible:ring-2 focus-visible:ring-indigo-500
        focus-visible:ring-offset-1
        focus-visible:ring-offset-white
        dark:focus-visible:ring-offset-[#0b0d12]
        ${
          isActive
            ? "border-indigo-200/70 bg-indigo-50/80 shadow-sm shadow-indigo-950/[0.02] dark:border-indigo-400/15 dark:bg-indigo-500/[0.10]"
            : "border-transparent hover:border-gray-200/80 hover:bg-gray-50 dark:hover:border-white/[0.06] dark:hover:bg-white/[0.035]"
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <span
          aria-hidden="true"
          className="
            absolute bottom-2 left-0 top-2
            w-[3px] rounded-r-full
            bg-indigo-600 dark:bg-indigo-400
          "
        />
      )}

      {/* Icon tile */}
      <span
        className={`
          relative flex h-8 w-8 shrink-0
          items-center justify-center overflow-hidden
          rounded-lg ring-1 ring-inset
          transition-all duration-150
          ${
            isActive
              ? "ring-indigo-500/15 shadow-sm shadow-indigo-950/[0.03]"
              : "ring-black/[0.03] group-hover:ring-black/[0.06] dark:ring-white/[0.05] dark:group-hover:ring-white/[0.08]"
          }
          ${iconBg || "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"}
        `}
      >
        <span
          className={`
            flex h-full w-full items-center justify-center
            transition-transform duration-150
            group-hover:scale-[1.04]
            [&>svg]:h-4 [&>svg]:w-4
          `}
        >
          {icon}
        </span>
      </span>

      {/* Module name and subtitle */}
      <span className="min-w-0 flex-1">
        <span
          className={`
            block truncate text-[12.5px] font-semibold
            tracking-[-0.01em] transition-colors duration-150
            ${
              isActive
                ? "text-indigo-700 dark:text-indigo-300"
                : "text-gray-700 group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-gray-100"
            }
          `}
        >
          {name}
        </span>

        {subtext && (
          <span
            className={`
              mt-0.5 block truncate text-[10.5px]
              leading-4 transition-colors duration-150
              ${
                isActive
                  ? "text-indigo-600/80 dark:text-indigo-300/70"
                  : "text-gray-500 dark:text-gray-500"
              }
            `}
          >
            {subtext}
          </span>
        )}
      </span>

      {/* Optional badge */}
      {badge !== undefined && badge !== null && badge !== "" && (
        <span
          className={`
            inline-flex shrink-0 items-center justify-center
            rounded-md border px-1.5 py-0.5
            text-[10px] font-semibold tabular-nums
            transition-colors duration-150
            ${
              isActive
                ? "border-indigo-200/70 bg-white/70 text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/[0.08] dark:text-indigo-300"
                : "border-gray-200/80 bg-white text-gray-500 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-gray-400"
            }
          `}
        >
          {badge}
        </span>
      )}

      {/* Navigation chevron */}
      <span
        aria-hidden="true"
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center
          transition-all duration-150
          ${
            isActive
              ? "translate-x-0 text-indigo-500 dark:text-indigo-400"
              : "text-gray-300 group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
          }
        `}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
};

export default ModuleCard;