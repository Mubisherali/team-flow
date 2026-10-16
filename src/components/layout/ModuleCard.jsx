// -------------------------------------------------------------
// ModuleCard - Reusable module row in the sidebar
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the sidebar as a navigation item.
//
// STRUCTURE:
//   <Link>
//     - Active indicator bar (left)
//     - Icon tile
//     - Name + subtext
//     - Optional badge
//     - Chevron
//
// POLISH:
//   - Focus-visible ring on link
//   - active:scale-[0.99] for tactile press
//   - aria-current="page" on active
//   - Icon tile gets subtle inner ring for depth
//   - Transitions normalized to duration-150
//
// PRESERVED:
//   - Props (href, icon, iconBg, name, subtext, exact, badge)
//   - isActive logic (exact vs. prefix match)
//   - All visual structure
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
      aria-current={isActive ? 'page' : undefined}
      className={`
        group relative flex items-center gap-3
        px-3 py-2.5 rounded-xl
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
        active:scale-[0.99]
        transition-all duration-150
        ${
          isActive
            ? 'bg-indigo-500/10 dark:bg-indigo-500/10'
            : 'hover:bg-gray-100 dark:hover:bg-white/[0.04]'
        }
      `}
    >
      {/* ─── Active indicator bar ─── */}
      {isActive && (
        <span
          aria-hidden="true"
          className="
            absolute left-0 top-1/2 -translate-y-1/2
            w-[3px] h-4 rounded-r-full
            bg-indigo-600 dark:bg-indigo-500
          "
        />
      )}

      {/* ─── Icon tile ─── */}
      <span
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ring-1 ring-inset ring-black/[0.02] dark:ring-white/[0.04]
          transition-colors duration-150
          ${iconBg}
        `}
      >
        {icon}
      </span>

      {/* ─── Text ─── */}
      <span className="flex-1 min-w-0">
        <span
          className={`
            block text-[13px] font-medium truncate
            transition-colors duration-150
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
              transition-colors duration-150
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

      {/* ─── Optional badge ─── */}
      {badge && (
        <span
          className="
            flex-shrink-0
            text-[10px] font-bold
            px-1.5 py-0.5 rounded-md
            bg-gray-100 dark:bg-white/[0.06]
            text-gray-500 dark:text-gray-400
          "
        >
          {badge}
        </span>
      )}

      {/* ─── Chevron ─── */}
      <span
        aria-hidden="true"
        className={`
          w-4 h-4 flex items-center justify-center flex-shrink-0
          transition-all duration-150
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
          strokeWidth="2"
          aria-hidden="true"
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