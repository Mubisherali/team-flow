// -------------------------------------------------------------
// Settings Layout - Shell for personal user settings
// -------------------------------------------------------------
//
// URL: /settings/*
//
// STRUCTURE:
//   - Page header (title)
//   - Left sub-nav (Profile / Appearance / Notifications)
//   - Right content area ({children})
//
// WHY A LAYOUT:
//   Every settings sub-page shares this shell. Adding new
//   settings sections is just adding a new folder + link.
//
// ACTIVE STATE:
//   Sub-nav uses usePathname() to highlight the current page.
//   That requires a client component, so we split the nav
//   into <SettingsNav />.
//
// WHY THIS LIVES IN (dashboard):
//   Settings is part of the dashboard shell (sidebar + user menu).
//   Putting it inside (dashboard) means it inherits that layout
//   automatically.
// -------------------------------------------------------------

import SettingsNav from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Two-column layout: sub-nav + content */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <SettingsNav />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}