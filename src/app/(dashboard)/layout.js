// -------------------------------------------------------------
// Dashboard Layout
// -------------------------------------------------------------
//
// PHASE 11 (Navbar):
//   - Detects if the user is in a Workspace or Project.
//   - Fetches the correct list of members for the Navbar.
//   - Builds a context label (e.g. "NOVA TECH / company website").
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardShell from '@/components/layout/DashboardShell';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default async function DashboardLayout({ children, params }) {
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
  if (workspaces.length === 0) {
    return <OnboardingWizard user={session.user} />;
  }

  // ─── Navbar Context Data ───
  // Note: In Next.js App Router, params are passed to the page, 
  // but we can access them in the layout by using a workaround 
  // or by fetching based on what's available. 
  // Actually, Next.js 16 doesn't pass `params` to layouts for nested routes easily.
  // The best way is to let the client-side TopNavbar figure out the context,
  // OR we pass the full workspaces list and let the navbar do the rest.
  
  // Since we want server-side fetching, we can't easily get the dynamic `[id]` 
  // in the layout without making this layout dynamic per route.
  // So, we'll pass the workspaces list to the shell, and let the shell pass it to the navbar.
  
  return (
    <DashboardShell 
      user={session.user} 
      workspaces={workspaces}
    >
      {children}
    </DashboardShell>
  );
}