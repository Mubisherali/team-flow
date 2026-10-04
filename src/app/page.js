// -------------------------------------------------------------
// Home Page
// -------------------------------------------------------------
//
// TWO BEHAVIORS:
//   Logged in  → redirect to /workspaces (dashboard)
//   Logged out → landing / hero page with "Get started" CTA
//
// WHY SERVER COMPONENT:
// Using getServerSession() lets us redirect BEFORE rendering
// any HTML. No flash, no "loading" state, no client roundtrip.
//
// The landing content is static markup — no interactivity —
// so keeping this whole page a server component gives us the
// smallest possible bundle.
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  // ─── Step 1: Read session server-side ───
  const session = await getServerSession(authOptions);

  // ─── Step 2: Logged-in users go straight to the dashboard ───
  if (session?.user) {
    redirect('/workspaces');
  }

  // ─── Step 3: Logged-out visitors see the landing page ───
  return <LandingPage />;
}

// =============================================================
// LANDING PAGE
// =============================================================
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ============ NAV ============ */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black">
            T
          </span>
          TeamFlow
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-20 sm:pt-20 text-center">
        {/* Badge */}
        <span className="inline-block px-3 py-1 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
          Project management for modern teams
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight">
          Plan, track, and ship
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            together.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          TeamFlow gives your team one place to manage projects, assign
          tasks, and track progress — with a Kanban board your team
          will actually enjoy using.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Get started free
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            Log in
          </Link>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 mb-16">
          No credit card required. Free for small teams.
        </p>

        {/* ============ FEATURE GRID ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <FeatureCard
            title="Workspaces"
            description="Organize your company, teams, and clients into separate spaces — each with their own members and projects."
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            }
          />
          <FeatureCard
            title="Projects & Tasks"
            description="Assign work, set priorities, add due dates, and track progress — all in one Kanban board."
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M9 11l3 3L22 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <FeatureCard
            title="Team Collaboration"
            description="Invite members with role-based access, comment on tasks, and keep everyone in the loop."
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  strokeLinecap="round"
                />
                <circle cx="9" cy="7" r="4" />
                <path
                  d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>

        {/* ============ HOW IT WORKS ============ */}
        <div className="mt-24 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Get up and running in seconds
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create your workspace"
              description="Set up a workspace for your team in one click. You become the owner automatically."
            />
            <StepCard
              number="2"
              title="Invite your team"
              description="Send email invitations to teammates. They join with the role you assign."
            />
            <StepCard
              number="3"
              title="Start shipping"
              description="Create projects, assign tasks, and watch work move from TODO to DONE."
            />
          </div>
        </div>

        {/* ============ FINAL CTA ============ */}
        <div className="mt-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to get your team organized?
          </h2>
          <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
            Join teams who use TeamFlow to plan their work and ship faster.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-indigo-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Get started free
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} TeamFlow. Built with Next.js.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// =============================================================
// FEATURE CARD
// =============================================================
const FeatureCard = ({ title, description, icon }) => (
  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md transition-all">
    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </div>
);

// =============================================================
// STEP CARD - numbered step in "how it works"
// =============================================================
const StepCard = ({ number, title, description }) => (
  <div className="flex flex-col">
    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-4">
      {number}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </div>
);