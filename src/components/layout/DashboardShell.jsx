// -------------------------------------------------------------
// DashboardShell - Client wrapper for the dashboard layout
// -------------------------------------------------------------
//
// PHASE 11 (Layout Fix):
//   - Properly handles mobile vs desktop sidebar rendering.
//   - Grid layout: [Sidebar] [Navbar + Content]
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
import ShortcutsModal from './ShortcutsModal';
import TopNavbar from './TopNavbar';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAppShortcuts } from '@/hooks/useAppShortcuts';
import { Toaster } from 'react-hot-toast';

const DashboardShell = ({ user, workspaces, children }) => {
  const isMobile = useIsMobile();
  const params = useParams() || {};

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [navMembers, setNavMembers] = useState([]);
  const [navContextLabel, setNavContextLabel] = useState(null);
  const [navMembersHref, setNavMembersHref] = useState(null);

  const workspaceId = params?.id;
  const projectId = params?.projectId;
  const isInsideProject = !!projectId;

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  useHotkeys({
    onOpenSearch: () => setSearchOpen(true),
  });

  useAppShortcuts({
    workspaceId,
    isInsideProject,
    onCreateTask: () => window.dispatchEvent(new CustomEvent('open-create-task')),
    onCreateProject: () => window.dispatchEvent(new CustomEvent('open-create-project')),
  });

  useEffect(() => {
    const handleOpenShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('open-shortcuts', handleOpenShortcuts);
    return () => window.removeEventListener('open-shortcuts', handleOpenShortcuts);
  }, []);

  // Fetch navbar context
  useEffect(() => {
    let cancelled = false;

    async function loadNavbarContext() {
      if (!workspaceId) {
        if (!cancelled) {
          setNavMembers([]);
          setNavContextLabel(null);
          setNavMembersHref(null);
        }
        return;
      }

      try {
        if (projectId) {
          const [projRes, projMembersRes] = await Promise.all([
            fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, { cache: 'no-store' }),
            fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/members`, { cache: 'no-store' }),
          ]);

          if (cancelled) return;

          if (projRes.ok && projMembersRes.ok) {
            const projData = await projRes.json();
            const membersData = await projMembersRes.json();
            setNavContextLabel(projData.project?.name || null);
            setNavMembers(membersData.members || []);
            setNavMembersHref(`/workspaces/${workspaceId}/projects/${projectId}#members`);
          }
        } else {
          const [wsRes, wsMembersRes] = await Promise.all([
            fetch(`/api/workspaces/${workspaceId}`, { cache: 'no-store' }),
            fetch(`/api/workspaces/${workspaceId}/members`, { cache: 'no-store' }),
          ]);

          if (cancelled) return;

          if (wsRes.ok && wsMembersRes.ok) {
            const wsData = await wsRes.json();
            const membersData = await wsMembersRes.json();
            setNavContextLabel(wsData.workspace?.name || null);
            setNavMembers(membersData.members || []);
            setNavMembersHref(`/workspaces/${workspaceId}/members`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[NAVBAR_CONTEXT_FETCH]', err);
          setNavMembers([]);
          setNavContextLabel(null);
          setNavMembersHref(null);
        }
      }
    }

    loadNavbarContext();
    return () => { cancelled = true; };
  }, [workspaceId, projectId]);

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0b0d12]">

        {/* ─── MOBILE ONLY: Top bar + Drawer ─── */}
        <div className="lg:hidden">
          <MobileTopbar user={user} onOpenSidebar={openDrawer} />
          <SidebarDrawer
            isOpen={drawerOpen}
            onClose={closeDrawer}
            isMobile={true}
          >
            <Sidebar
              user={user}
              workspaces={workspaces}
              onClose={closeDrawer}
            />
          </SidebarDrawer>
        </div>

        {/* ─── MAIN GRID (Desktop) ─── */}
        <div className="lg:grid lg:grid-cols-[270px_1fr] lg:min-h-screen">

          {/* Desktop Sidebar Column */}
          <div className="hidden lg:block">
            <div className="sticky top-0 h-screen overflow-y-auto">
              <Sidebar user={user} workspaces={workspaces} />
            </div>
          </div>

          {/* Right column: Navbar + Content */}
          <div className="flex flex-col min-w-0">

            {/* Desktop Navbar (hidden on mobile) */}
            <div className="hidden lg:block sticky top-0 z-30">
              <TopNavbar
                user={user}
                members={navMembers}
                contextLabel={navContextLabel}
                membersHref={navMembersHref}
              />
            </div>

            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>

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

        <NotificationToaster />
        <NotificationSound />
      </div>
    </NotificationsProvider>
  );
};

export default DashboardShell;