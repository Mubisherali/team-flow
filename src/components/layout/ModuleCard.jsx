// -------------------------------------------------------------
// ModuleCard - Reusable module row in the sidebar
// -------------------------------------------------------------
//
// PROPS:
//   href     : string       — where the card navigates to
//   icon     : JSX element  — the SVG icon (rendered inside a tile)
//   iconBg   : string       — Tailwind classes for the icon tile background
//                              e.g. 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
//   name     : string       — e.g. 'Projects'
//   subtext  : string|null  — e.g. '3 active' or '5 teammates'
//   exact    : boolean      — match route exactly (default false = prefix match)
//   badge    : string|null  — small badge on the right (e.g. 'NEW')
//
// BEHAVIOR:
//   Active state highlights when the current route matches href.
// -------------------------------------------------------------

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ModuleCard = ({
  href,
  icon,
  iconBg,
  name,
  subtext,
  exact = false,
  badge,
}) => {
  const pathname = usePathname() || '';

  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200
        ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-500/10 shadow-sm'
            : 'hover:bg-gray-100 dark:hover:bg-white/[0.04]'
        }
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-500" />
      )}

      {/* Icon tile */}
      <span
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          flex-shrink-0 transition-colors
          ${iconBg}
        `}
      >
        {icon}
      </span>

      {/* Text */}
      <span className="flex-1 min-w-0">
        <span
          className={`
            block text-[13px] font-medium truncate
            ${
              isActive
                ? 'text-indigo-700 dark:text-indigo-300'
                : 'text-gray-800 dark:text-gray-200'
            }
          `}
        >
          {name}
        </span>
        {subtext && (
          <span
            className={`
              block text-[10.5px] truncate mt-0.5
              ${
                isActive
                  ? 'text-indigo-600/80 dark:text-indigo-400/80'
                  : 'text-gray-500 dark:text-gray-500'
              }
            `}
          >
            {subtext}
          </span>
        )}
      </span>

      {/* Optional badge */}
      {badge && (
        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 flex-shrink-0">
          {badge}
        </span>
      )}

      {/* Chevron — appears on hover or when active */}
      <span
        className={`
          w-4 h-4 flex items-center justify-center flex-shrink-0
          transition-all duration-200
          ${
            isActive
              ? 'text-indigo-500 dark:text-indigo-400'
              : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5'
          }
        `}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            d="m9 18 6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
};

export default ModuleCard;