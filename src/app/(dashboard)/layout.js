// -------------------------------------------------------------
// Dashboard Layout
// -------------------------------------------------------------
//
// PHASE 11 (Onboarding):
//   - Checks if the user has 0 workspaces.
//   - If so, renders the <OnboardingWizard /> full-screen
//     instead of the normal dashboard shell.
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardShell from '@/components/layout/DashboardShell';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ─── Fetch user's workspaces ───
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
  }));

  // ─── Onboarding Flow ───
  // If the user has no workspaces, show the wizard.
  if (workspaces.length === 0) {
    return <OnboardingWizard user={session.user} />;
  }

  // ─── Normal Dashboard ───
  return (
    <DashboardShell user={session.user} workspaces={workspaces}>
      {children}
    </DashboardShell>
  );
}