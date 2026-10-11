// -------------------------------------------------------------
// Dashboard Layout
// -------------------------------------------------------------
//
// SERVER COMPONENT:
//   - Reads session
//   - Fetches workspaces (for the sidebar)
//   - Renders <DashboardShell> (client) with the fetched data
//
// WHY THE SPLIT:
//   Server needs to be async + access DB + session. But the
//   responsive drawer needs client-side state. So this file
//   stays a server component and delegates rendering to a
//   client shell.
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardShell from '@/components/layout/DashboardShell';

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

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <DashboardShell user={user} workspaces={workspaces}>
      {children}
    </DashboardShell>
  );
}