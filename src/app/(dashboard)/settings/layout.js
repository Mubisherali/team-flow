// -------------------------------------------------------------
// Settings Layout - Shell for personal user settings
// -------------------------------------------------------------
//
// URL: /settings/*
//
// STRUCTURE:
//   - Page header (title + subtitle)
//   - Two-column grid: sub-nav (left) + content (right)
//
// POLISH:
//   - Tighter type scale (Wave-3)
//   - Responsive padding (p-6 → sm:p-8)
//   - A11y: semantic <main> already used
//
// PRESERVED:
//   - Same structure (header + grid)
//   - Same SettingsNav usage
//   - Same children rendering
// -------------------------------------------------------------

import SettingsNav from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }) {
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      {/* ══════════ PAGE HEADER ══════════ */}
      <header className="mb-8">
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </header>

      {/* ══════════ TWO-COLUMN LAYOUT ══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-8">
        <SettingsNav />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}