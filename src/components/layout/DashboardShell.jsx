// -------------------------------------------------------------
// DashboardShell - Client wrapper for the dashboard layout
// -------------------------------------------------------------
//
// PHASE 11 (Shortcuts):
//   - Integrated global keyboard shortcuts (G+W, C, N, ?)
//   - Integrated Shortcuts cheat sheet modal
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import Sidebar from './Sidebar';
import MobileTopbar from './MobileTopbar';
import SidebarDrawer from './SidebarDrawer';
import NotificationToaster from './NotificationToaster';
import NotificationSound from './NotificationSound';
import CommandPalette from './CommandPalette';
import ShortcutsModal from './ShortcutsModal'; // <-- ADDED
import { NotificationsProvider } from '@/context/NotificationsContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAppShortcuts } from '@/hooks/useAppShortcuts'; // <-- ADDED
import { Toaster } from 'react-hot-toast';

const DashboardShell = ({ user, workspaces, children }) => {
  const isMobile = useIsMobile();
  const params = useParams() || {};

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false); // <-- ADDED

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  // Context
  const workspaceId = params?.id;
  const projectId = params?.projectId;
  const isInsideProject = !!projectId;

  // ─── Global Cmd+K listener ───
  useHotkeys({
    onOpenSearch: () => setSearchOpen(true),
  });

  // ─── Global App Shortcuts (G+W, C, N, ?) ───
  useAppShortcuts({
    workspaceId,
    isInsideProject,
    // If inside a project, 'C' triggers Create Task
    onCreateTask: () => {
      // We dispatch a custom event that ProjectTasksSection listens to
      window.dispatchEvent(new CustomEvent('open-create-task'));
    },
    // If inside a workspace, 'N' triggers Create Project
    onCreateProject: () => {
      // We dispatch a custom event that ProjectsSection listens to
      window.dispatchEvent(new CustomEvent('open-create-project'));
    },
  });

  // ─── Listen for '?' to open Cheat Sheet ───
  useEffect(() => {
    const handleOpenShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('open-shortcuts', handleOpenShortcuts);
    return () => window.removeEventListener('open-shortcuts', handleOpenShortcuts);
  }, []);

  return (
    <NotificationsProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-950">
        {/* Mobile top bar */}
        <MobileTopbar user={user} onOpenSidebar={openDrawer} />

        {/* Sidebar / Drawer */}
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

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>

        {/* Global Overlays */}
        <CommandPalette
          open={searchOpen}
          setOpen={setSearchOpen}
          workspaceId={workspaceId}
          projectId={projectId}
        />

        <ShortcutsModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        {/* Toast portal */}
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

        {/* Notification effects */}
        <NotificationToaster />
        <NotificationSound />
      </div>
    </NotificationsProvider>
  );
};

export default DashboardShell;