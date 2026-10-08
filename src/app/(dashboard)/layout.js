// -------------------------------------------------------------
// Dashboard Layout
// -------------------------------------------------------------
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { Toaster } from 'react-hot-toast';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/layout/Sidebar';
import { NotificationsProvider } from '@/context/NotificationsContext';
import NotificationToaster from '@/components/layout/NotificationToaster';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
  }));

  return (
    <NotificationsProvider>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
        <Sidebar
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
          workspaces={workspaces}
        />

        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Toast renderer — mounts the portal that shows toasts.
            Position + duration are configured per-toast. */}
       <Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: 'transparent',
      boxShadow: 'none',
      padding: 0,
      margin: 0,
    },
  }}
/>

        {/* Watches for new notification arrivals and fires toasts */}
        <NotificationToaster />
      </div>
    </NotificationsProvider>
  );
}