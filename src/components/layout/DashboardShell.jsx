// -------------------------------------------------------------
// DashboardShell - Client wrapper for the dashboard layout
// -------------------------------------------------------------
//
// WHY THIS EXISTS:
//   The dashboard layout is a server component (needed for
//   session + DB access). But the responsive drawer + topbar
//   require CLIENT state (useState for drawer open/close,
//   useMediaQuery for breakpoint awareness).
//
//   So we split:
//     - layout.jsx (server) → fetches data, renders this shell
//     - DashboardShell.jsx (client) → owns the drawer state
//
// WHAT IT RENDERS:
//   - MobileTopbar (visible on mobile)
//   - SidebarDrawer wrapping the Sidebar
//   - <main> with children
//   - NotificationsProvider (wraps bell + toaster + sound)
//   - Toast renderer (react-hot-toast)
//   - NotificationToaster + NotificationSound (effects)
//
// PROPS:
//   user       : session user object
//   workspaces : array of workspace memberships
//   children   : page content
// -------------------------------------------------------------

'use client';

import { useState } from 'react';

import Sidebar from './Sidebar';
import MobileTopbar from './MobileTopbar';
import SidebarDrawer from './SidebarDrawer';
import NotificationToaster from './NotificationToaster';
import NotificationSound from './NotificationSound';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Toaster } from 'react-hot-toast';

const DashboardShell = ({ user, workspaces, children }) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <NotificationsProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-950">
        {/* ─── Mobile top bar ─── */}
        <MobileTopbar user={user} onOpenSidebar={openDrawer} />

        {/* ─── Sidebar / Drawer ─── */}
        <SidebarDrawer
          isOpen={drawerOpen}
          onClose={closeDrawer}
          isMobile={isMobile}
        >
          <Sidebar
            user={user}
            workspaces={workspaces}
            onClose={isMobile ? closeDrawer : undefined}
          />
        </SidebarDrawer>

        {/* ─── Main content ─── */}
        <main className="flex-1 min-w-0">{children}</main>

        {/* ─── Toast portal ─── */}
        <Toaster
          position="top-center"
          containerStyle={{ top: 20 }}
          toastOptions={{
            style: {
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              maxWidth: '100%',
            },
          }}
        />

        {/* ─── Notification effects ─── */}
        <NotificationToaster />
        <NotificationSound />
      </div>
    </NotificationsProvider>
  );
};

export default DashboardShell;