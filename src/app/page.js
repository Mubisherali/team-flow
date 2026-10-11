// -------------------------------------------------------------
// Home Page - Public landing
// -------------------------------------------------------------
//
// TWO BEHAVIORS:
//   Logged in  → redirect to /workspaces (dashboard)
//   Logged out → marketing landing page
//
// STRUCTURE:
//   - Nav (logo, log in, get started)
//   - Hero (badge, headline, subhead, CTAs, feature strip)
//   - CSS-drawn Kanban mockup (no images — pure Tailwind)
//   - Feature grid (3 cards)
//   - How it works (3 steps with connecting line)
//   - Final CTA (gradient box)
//   - Footer
//
// MOTION:
//   - Every section fades + slides up on scroll-in via Framer Motion
//     (whileInView)
//   - Cards have hover lift
//   - Buttons have active scale
//
// SERVER COMPONENT:
//   The page itself is a server component (for the redirect).
//   The animated content is a client component (LandingPage).
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/marketing/LandingPage';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect('/workspaces');
  }

  return <LandingPage />;
}