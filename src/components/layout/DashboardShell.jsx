// -------------------------------------------------------------
// DashboardShell - Client wrapper for the dashboard layout
// -------------------------------------------------------------
//
// (header preserved + note below)
//
// NEW (Phase 11):
//   - Integrated CommandPalette (Cmd+K)
//   - Global hotkey listener for search
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation'; // <-- ADDED

import Sidebar from './Sidebar';
import MobileTopbar from './MobileTopbar';
import SidebarDrawer from './SidebarDrawer';
import NotificationToaster from './NotificationToaster';
import NotificationSound from './NotificationSound';
import CommandPalette from './CommandPalette'; // <-- ADDED
import { NotificationsProvider } from '@/context/NotificationsContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useHotkeys } from '@/hooks/useHotkeys'; // <-- ADDED
import { Toaster } from 'react-hot-toast';

const DashboardShell = ({ user, workspaces, children }) => {
  const isMobile = useIsMobile();
  const params = useParams() || {}; // <-- ADDED

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // <-- ADDED

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  // ─── Global Cmd+K listener ───
  useHotkeys({
    onOpenSearch: () => setSearchOpen(true),
  });

  // ─── Extract context from URL for smart actions ───
  const workspaceId = params?.id;
  const projectId = params?.projectId;

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

        {/* ─── Global Search Command Palette ─── */}
        <CommandPalette
          open={searchOpen}
          setOpen={setSearchOpen}
          workspaceId={workspaceId}
          projectId={projectId}
        />

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