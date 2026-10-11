// -------------------------------------------------------------
// LandingPage - Public marketing page for TeamFlow
// -------------------------------------------------------------
//
// CLIENT COMPONENT (for Framer Motion animations).
//
// SECTIONS:
//   1. Nav
//   2. Hero (badge, headline, CTAs, feature strip)
//   3. Kanban mockup (CSS-drawn, no images)
//   4. Feature grid (3 cards)
//   5. How it works (3 steps)
//   6. Final CTA
//   7. Footer
//
// ANIMATION STRATEGY:
//   Each section fades + slides up when it enters the viewport,
//   via `whileInView` + `viewport={{ once: true }}`.
//   Subtle, purposeful, not distracting.
// -------------------------------------------------------------

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// -------------------------------------------------------------
// SHARED ANIMATION VARIANTS
// -------------------------------------------------------------
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// -------------------------------------------------------------
// MAIN
// -------------------------------------------------------------
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c10] text-gray-900 dark:text-white">
      {/* ─────────── NAV ─────────── */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-gray-50/80 dark:bg-[#0a0c10]/80 border-b border-gray-200/70 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="TeamFlow"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-[15px] font-bold tracking-tight">
              TeamFlow
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block px-3.5 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="
                px-3.5 py-2 rounded-lg
                text-[13px] font-medium
                bg-indigo-600 hover:bg-indigo-700
                text-white
                active:scale-[0.98]
                transition-all duration-200
                shadow-sm shadow-indigo-500/20
              "
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─────────── HERO ─────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-10 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.span
            variants={staggerItem}
            className="
              inline-flex items-center gap-1.5
              px-3 py-1 mb-6 rounded-full
              bg-indigo-50 dark:bg-indigo-500/10
              text-indigo-700 dark:text-indigo-300
              text-[11.5px] font-medium
              border border-indigo-100 dark:border-indigo-500/20
            "
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Project management for modern teams
          </motion.span>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6 max-w-4xl"
          >
            Plan, track, and ship{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              together.
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={staggerItem}
            className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-9 leading-relaxed"
          >
            TeamFlow gives your team one place to manage projects, assign
            tasks, and track progress — with a Kanban board your team
            will actually enjoy using.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-5"
          >
            <Link
              href="/login"
              className="
                group inline-flex items-center justify-center gap-2
                px-5 py-3 rounded-xl
                bg-indigo-600 hover:bg-indigo-700
                text-white text-sm font-medium
                active:scale-[0.98]
                transition-all duration-200
                shadow-lg shadow-indigo-500/25
              "
            >
              Get started free
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
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
              className="
                inline-flex items-center justify-center
                px-5 py-3 rounded-xl
                border border-gray-200 dark:border-white/[0.08]
                text-gray-700 dark:text-gray-200
                text-sm font-medium
                hover:bg-white dark:hover:bg-white/[0.04]
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              Log in
            </Link>
          </motion.div>

          {/* Feature strip */}
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-gray-500 dark:text-gray-500"
          >
            <FeatureStripItem icon="check">No credit card</FeatureStripItem>
            <Dot />
            <FeatureStripItem icon="check">Free for small teams</FeatureStripItem>
            <Dot />
            <FeatureStripItem icon="check">Email · Google · GitHub</FeatureStripItem>
          </motion.div>
        </motion.div>
      </section>

      {/* ─────────── KANBAN MOCKUP ─────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="
            relative
            rounded-2xl
            border border-gray-200 dark:border-white/[0.08]
            bg-white dark:bg-[#0f1115]
            shadow-2xl shadow-black/5 dark:shadow-black/40
            overflow-hidden
          "
        >
          {/* Faux window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-[11px] text-gray-500 dark:text-gray-500 font-mono">
              teamflow.app/workspaces/nova-tech
            </span>
          </div>

          {/* Mockup body */}
          <div className="p-4 sm:p-6">
            <KanbanPreview />
          </div>
        </motion.div>
      </section>

      {/* ─────────── FEATURE GRID ─────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything your team needs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            One place for the work, the people, and the progress.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <FeatureCard
            title="Workspaces"
            description="Organize your company, teams, and clients into separate spaces — each with their own members and projects."
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <FeatureCard
            title="Team Collaboration"
            description="Invite members with role-based access, comment on tasks, and keep everyone in the loop."
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
              </svg>
            }
          />
        </motion.div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Get up and running in seconds
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            No setup, no invites to nowhere, no friction.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-5 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.08] to-transparent"
            aria-hidden="true"
          />

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
        </motion.div>
      </section>

      {/* ─────────── FINAL CTA ─────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="
            relative overflow-hidden
            rounded-3xl
            bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600
            px-6 sm:px-12 py-14 sm:py-16 text-center
          "
        >
          {/* Subtle radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.15),transparent_60%)]"
          />

          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
              Ready to get your team organized?
            </h2>
            <p className="text-indigo-100/90 mb-8 max-w-lg mx-auto text-sm sm:text-base">
              Join teams who use TeamFlow to plan their work and ship faster.
            </p>
            <Link
              href="/login"
              className="
                group inline-flex items-center justify-center gap-2
                px-5 py-3 rounded-xl
                bg-white text-indigo-700
                text-sm font-semibold
                hover:bg-gray-50
                active:scale-[0.98]
                transition-all duration-200
                shadow-lg shadow-black/10
              "
            >
              Get started free
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="TeamFlow"
                width={24}
                height={24}
                className="rounded-md"
              />
              <span className="text-[13px] font-bold tracking-tight">
                TeamFlow
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-[12px] text-gray-500 dark:text-gray-500">
              <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign up
              </Link>
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
          </div>

          <p className="mt-8 text-[11px] text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} TeamFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// =============================================================
// FEATURE STRIP ITEM
// =============================================================
const FeatureStripItem = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5">
    {icon === 'check' && (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-emerald-500"
      >
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {children}
  </span>
);

const Dot = () => (
  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-white/[0.08]" />
);

// =============================================================
// FEATURE CARD
// =============================================================
const FeatureCard = ({ title, description, icon }) => (
  <motion.div
    variants={staggerItem}
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className="
      group rounded-2xl
      border border-gray-200 dark:border-white/[0.06]
      bg-white dark:bg-white/[0.02]
      p-6
      hover:border-indigo-300 dark:hover:border-indigo-500/30
      hover:shadow-lg hover:shadow-indigo-500/5
      transition-colors duration-200
    "
  >
    <div
      className="
        w-10 h-10 rounded-xl mb-4
        bg-indigo-50 dark:bg-indigo-500/10
        text-indigo-600 dark:text-indigo-400
        flex items-center justify-center
        group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/15
        transition-colors duration-200
      "
    >
      {icon}
    </div>
    <h3 className="text-[15px] font-semibold mb-2">{title}</h3>
    <p className="text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </motion.div>
);

// =============================================================
// STEP CARD
// =============================================================
const StepCard = ({ number, title, description }) => (
  <motion.div variants={staggerItem} className="flex flex-col">
    <div
      className="
        w-10 h-10 rounded-full mb-4
        bg-indigo-600 text-white
        flex items-center justify-center
        font-bold text-sm
        ring-4 ring-gray-50 dark:ring-[#0a0c10]
        shadow-lg shadow-indigo-500/25
      "
    >
      {number}
    </div>
    <h3 className="text-[15px] font-semibold mb-2">{title}</h3>
    <p className="text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </motion.div>
);

// =============================================================
// KANBAN PREVIEW - CSS-drawn mockup (no images)
// =============================================================
// Renders four Kanban columns with fake task cards. Uses the
// same color language as the real app for consistency.
const KanbanPreview = () => {
  const columns = [
    {
      label: 'To do',
      dot: 'bg-gray-400',
      tasks: [
        { title: 'Build product page', priority: 'bg-amber-500', tag: 'frontend' },
        { title: 'Create checkout API', priority: 'bg-red-500', tag: 'backend' },
        { title: 'Setup CI pipeline', priority: 'bg-gray-400', tag: 'devops' },
      ],
    },
    {
      label: 'In progress',
      dot: 'bg-blue-500',
      tasks: [
        { title: 'Fix mobile navbar', priority: 'bg-amber-500', tag: 'bug' },
        { title: 'Implement wishlist', priority: 'bg-blue-500', tag: 'feature' },
      ],
    },
    {
      label: 'Review',
      dot: 'bg-amber-500',
      tasks: [
        { title: 'Refactor auth flow', priority: 'bg-amber-500', tag: 'refactor' },
      ],
    },
    {
      label: 'Done',
      dot: 'bg-emerald-500',
      tasks: [
        { title: 'Setup Postgres', priority: 'bg-emerald-500', tag: 'infra', done: true },
        { title: 'Design system', priority: 'bg-emerald-500', tag: 'ui', done: true },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {columns.map((col) => (
        <div key={col.label} className="flex flex-col gap-2">
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              {col.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-600">
              {col.tasks.length}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {col.tasks.map((task) => (
              <div
                key={task.title}
                className="
                  rounded-lg
                  border border-gray-100 dark:border-white/[0.05]
                  bg-gray-50/70 dark:bg-white/[0.02]
                  p-2.5
                  text-[11px]
                  leading-tight
                "
              >
                <p
                  className={`font-medium mb-1.5 ${
                    task.done
                      ? 'text-gray-400 dark:text-gray-600 line-through'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${task.priority}`} />
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                    {task.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandingPage;