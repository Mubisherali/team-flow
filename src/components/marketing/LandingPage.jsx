// -------------------------------------------------------------
// LandingPage - Public marketing page for TeamFlow
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// -------------------------------------------------------------
// ANIMATION VARIANTS
// -------------------------------------------------------------
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c10] text-gray-900 dark:text-white selection:bg-indigo-500/30">
      <Nav />
      <Hero />
      <SocialProof />
      <KanbanMockup />
      <Features />
      <DeepDive />
      <AnalyticsShowcase />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// =============================================================
// 1. NAV
// =============================================================
const Nav = () => (
  <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-50/80 dark:bg-[#0a0c10]/80 border-b border-gray-200/70 dark:border-white/[0.06]">
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <img src="/logo.png" alt="TeamFlow" width={32} height={32} className="rounded-lg group-hover:scale-105 transition-transform" />
        <span className="text-[15px] font-bold tracking-tight">TeamFlow</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-gray-600 dark:text-gray-400">
        <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
        <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
        <a href="#faq" className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/login" className="hidden sm:inline-block px-3.5 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          Log in
        </Link>
        <Link href="/login" className="px-3.5 py-2 rounded-lg text-[13px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] transition-all shadow-sm shadow-indigo-500/20">
          Get started
        </Link>
      </div>
    </div>
  </nav>
);

// =============================================================
// 2. HERO
// =============================================================
const Hero = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-20 sm:pt-28 pb-12 text-center">
    <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col items-center">
      <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11.5px] font-medium border border-indigo-100 dark:border-indigo-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        v2.2 is live — Analytics & Global Search
      </motion.span>

      <motion.h1 variants={staggerItem} className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-4xl">
        Plan, track, and ship{' '}
        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
          together.
        </span>
      </motion.h1>

      <motion.p variants={staggerItem} className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">
        TeamFlow gives your team one place to manage projects, assign tasks, and track progress — with a Kanban board your team will actually enjoy using.
      </motion.p>

      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Link href="/login" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25">
          Get started free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <Link href="/login" className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-white dark:hover:bg-white/[0.04] active:scale-[0.98] transition-all">
          Log in
        </Link>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-gray-500 dark:text-gray-500">
        <FeatureStripItem>No credit card required</FeatureStripItem>
        <Dot />
        <FeatureStripItem>Free for small teams</FeatureStripItem>
        <Dot />
        <FeatureStripItem>Email · Google · GitHub</FeatureStripItem>
      </motion.div>
    </motion.div>
  </section>
);

// =============================================================
// 3. SOCIAL PROOF
// =============================================================
const SocialProof = () => (
  <motion.section {...fadeUp} className="max-w-6xl mx-auto px-5 sm:px-6 py-8 border-y border-gray-200/50 dark:border-white/[0.04]">
    <p className="text-center text-[11px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-600 mb-6">
      Trusted by 500+ teams worldwide
    </p>
    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 dark:opacity-40 grayscale">
      <CompanyLogo name="Acme Corp" />
      <CompanyLogo name="NovaTech" />
      <CompanyLogo name="Pulse" />
      <CompanyLogo name="Linear" />
      <CompanyLogo name="Vercel" />
    </div>
  </motion.section>
);

// =============================================================
// 4. KANBAN MOCKUP
// =============================================================
const KanbanMockup = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7, ease: 'easeOut' }} className="relative rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115] shadow-2xl shadow-black/5 dark:shadow-black/40 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[11px] text-gray-500 dark:text-gray-500 font-mono">teamflow.app/workspaces/nova-tech</span>
      </div>
      <div className="p-4 sm:p-6"><KanbanPreview /></div>
    </motion.div>
  </section>
);

// =============================================================
// 5. FEATURES GRID
// =============================================================
const Features = () => (
  <section id="features" className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
    <motion.div {...fadeUp} className="text-center mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything your team needs</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">One place for the work, the people, and the progress.</p>
    </motion.div>

    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <FeatureCard title="Workspaces" description="Organize your company, teams, and clients into separate spaces — each with their own members and projects." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>} />
      <FeatureCard title="Kanban Boards" description="Drag tasks from Todo to Done. Track progress visually with four workflow columns." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18" /></svg>} />
      <FeatureCard title="Team Collaboration" description="Invite members with role-based access, comment on tasks, and keep everyone in the loop." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>} />
      <FeatureCard title="Real-time Notifications" description="Get notified the second something changes — task assignments, comments, and review requests." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>} />
      <FeatureCard title="Analytics Dashboard" description="Velocity charts, team workload, priority mix, and due-date health — real insights from your data." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12A10 10 0 1112 2v10z" /></svg>} />
      <FeatureCard title="Global Search (Cmd+K)" description="Jump to any task, project, or workspace in milliseconds. Keyboard-first navigation." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>} />
    </motion.div>
  </section>
);

// =============================================================
// 6. DEEP DIVE
// =============================================================
const DeepDive = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
    <div className="space-y-24">
      <DeepDiveRow
        reverse
        eyebrow="Workflow"
        title="From review to done — with manager approval built in."
        description="Members submit tasks for review. Managers approve and mark them Done. The workflow enforces itself — no accidental early completions."
        visual={<ReviewMockup />}
      />
      <DeepDiveRow
        eyebrow="Speed"
        title="Find anything in milliseconds with Cmd+K."
        description="A global command palette that lets you search tasks, jump to projects, and create new work — all without touching the mouse."
        visual={<SearchMockup />}
      />
    </div>
  </section>
);

// =============================================================
// 7. ANALYTICS SHOWCASE
// =============================================================
const AnalyticsShowcase = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
    <motion.div {...fadeUp} className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Real insights from your team's data</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">Velocity, workload, and due-date health — right on your workspace dashboard.</p>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115] p-6 shadow-2xl shadow-black/5 dark:shadow-black/40">
      <AnalyticsPreview />
    </motion.div>
  </section>
);

// =============================================================
// 8. TESTIMONIALS
// =============================================================
const Testimonials = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
    <motion.div {...fadeUp} className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Loved by teams that ship</h2>
    </motion.div>
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <TestimonialCard quote="TeamFlow replaced 3 tools for us. The Kanban + analytics combo is unbeatable." author="Sarah K." role="CTO @ Acme Corp" />
      <TestimonialCard quote="The review workflow is a game-changer. Our team ships faster and cleaner." author="Marcus T." role="Engineering Lead @ NovaTech" />
      <TestimonialCard quote="Cmd+K alone saves me 20 minutes a day. Best UX of any project tool I've used." author="Priya R." role="Founder @ Pulse" />
    </motion.div>
  </section>
);

// =============================================================
// 9. PRICING
// =============================================================
const Pricing = () => (
  <section id="pricing" className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
    <motion.div {...fadeUp} className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">Start free. Upgrade when your team grows.</p>
    </motion.div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <PricingCard tier="Free" price="$0" description="For small teams getting started." features={['Up to 5 members', 'Unlimited projects', 'Kanban boards', 'Comments & notifications']} cta="Get started" />
      <PricingCard tier="Pro" price="$12" suffix="/user/mo" description="For growing teams that need more." features={['Unlimited members', 'Analytics dashboard', 'Global search (Cmd+K)', 'Priority support', 'Custom roles']} cta="Start free trial" highlighted />
      <PricingCard tier="Enterprise" price="Custom" description="For organizations at scale." features={['SSO / SAML', 'Dedicated support', 'Custom SLA', 'Onboarding assistance', 'Audit logs']} cta="Contact sales" />
    </div>
  </section>
);

// =============================================================
// 10. FAQ
// =============================================================
const FAQ = () => (
  <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
    <motion.div {...fadeUp} className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Frequently asked questions</h2>
    </motion.div>
    <div className="space-y-3">
      <FAQItem q="Is TeamFlow really free for small teams?" a="Yes. Our Free tier supports up to 5 members with unlimited projects and tasks. No credit card required." />
      <FAQItem q="How does the review workflow work?" a="Members move tasks to Review when they're finished. Only managers or owners can move them to Done — this prevents accidental early completions." />
      <FAQItem q="Can I import my existing projects?" a="Right now TeamFlow is API-first. Bulk import tools are on the roadmap — for now, teams typically recreate their structure in minutes." />
      <FAQItem q="What about security and data privacy?" a="All data is encrypted in transit. We use Neon (Postgres) with row-level access controls and never share your data with third parties." />
      <FAQItem q="Can I cancel anytime?" a="Yes. Pro subscriptions can be cancelled anytime with one click from your settings. No hidden fees." />
    </div>
  </section>
);

// =============================================================
// 11. FINAL CTA
// =============================================================
const FinalCTA = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-20">
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 px-6 sm:px-12 py-16 sm:py-20 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.15),transparent_60%)]" />
      <div className="relative">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-white">Ready to get your team organized?</h2>
        <p className="text-indigo-100/90 mb-10 max-w-lg mx-auto text-sm sm:text-base">Join 500+ teams who use TeamFlow to plan their work and ship faster.</p>
        <Link href="/login" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-lg shadow-black/10">
          Get started free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </motion.div>
  </section>
);

// =============================================================
// 12. FOOTER
// =============================================================
const Footer = () => (
  <footer className="border-t border-gray-200 dark:border-white/[0.06]">
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="TeamFlow" width={28} height={28} className="rounded-md" />
          <span className="text-[14px] font-bold tracking-tight">TeamFlow</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-[13px] text-gray-500 dark:text-gray-500">
          <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
          <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Log in</Link>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-600">© {new Date().getFullYear()} TeamFlow. All rights reserved.</p>
    </div>
  </footer>
);

// =============================================================
// SUB-COMPONENTS
// =============================================================
const FeatureStripItem = ({ children }) => (
  <span className="inline-flex items-center gap-1.5">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    {children}
  </span>
);

const Dot = () => <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-white/[0.08]" />;

const CompanyLogo = ({ name }) => (
  <span className="text-[16px] font-bold tracking-tight text-gray-900 dark:text-white">{name}</span>
);

const FeatureCard = ({ title, description, icon }) => (
  <motion.div variants={staggerItem} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="group rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-colors duration-200">
    <div className="w-10 h-10 rounded-xl mb-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/15 transition-colors">{icon}</div>
    <h3 className="text-[15px] font-semibold mb-2">{title}</h3>
    <p className="text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
  </motion.div>
);

const DeepDiveRow = ({ eyebrow, title, description, visual, reverse }) => (
  <motion.div {...fadeUp} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
    <div className={reverse ? 'lg:order-2' : ''}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">{eyebrow}</p>
      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 leading-tight">{title}</h3>
      <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
    <div className={reverse ? 'lg:order-1' : ''}>{visual}</div>
  </motion.div>
);

const TestimonialCard = ({ quote, author, role }) => (
  <motion.div variants={staggerItem} className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
    <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[12px] font-bold">{author.charAt(0)}</div>
      <div>
        <p className="text-[13px] font-semibold">{author}</p>
        <p className="text-[11.5px] text-gray-500">{role}</p>
      </div>
    </div>
  </motion.div>
);

const PricingCard = ({ tier, price, suffix, description, features, cta, highlighted }) => (
  <motion.div variants={staggerItem} className={`relative rounded-2xl p-7 ${highlighted ? 'border-2 border-indigo-500 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 bg-white dark:bg-[#0f1115]' : 'border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]'}`}>
    {highlighted && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">Most popular</span>
    )}
    <h3 className="text-[15px] font-semibold mb-1">{tier}</h3>
    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mb-5">{description}</p>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-3xl font-bold">{price}</span>
      {suffix && <span className="text-[12px] text-gray-500">{suffix}</span>}
    </div>
    <ul className="space-y-2.5 mb-7">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-[13px] text-gray-600 dark:text-gray-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500 flex-shrink-0 mt-0.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {f}
        </li>
      ))}
    </ul>
    <Link href="/login" className={`block text-center py-2.5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98] ${highlighted ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25' : 'border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}>
      {cta}
    </Link>
  </motion.div>
);

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-[14px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
        {q}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================
// MOCKUPS
// =============================================================
const ReviewMockup = () => (
  <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115] p-5 shadow-lg">
    <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[12px] font-medium text-gray-600 dark:text-gray-400">Review</span></div>
    <div className="rounded-lg border border-gray-100 dark:border-white/[0.05] bg-gray-50/70 dark:bg-white/[0.02] p-3">
      <p className="text-[12.5px] font-medium text-gray-800 dark:text-gray-200 mb-2">Refactor auth flow</p>
      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500">refactor</span></div>
    </div>
    <div className="mt-3 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
      <p className="text-[11px] text-indigo-700 dark:text-indigo-300">✓ Move to Done (manager approval required)</p>
    </div>
  </div>
);

const SearchMockup = () => (
  <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115] p-5 shadow-lg">
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] mb-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      <span className="text-[12px] text-gray-400">Search tasks...</span>
      <span className="ml-auto px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/[0.06] text-[9px] font-medium text-gray-500">⌘K</span>
    </div>
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04]"><span className="w-4 h-4 rounded bg-gray-200 dark:bg-white/[0.06]" /><span className="text-[11.5px] text-gray-700 dark:text-gray-300">Create checkout API</span></div>
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10"><span className="w-4 h-4 rounded bg-indigo-200 dark:bg-indigo-500/30" /><span className="text-[11.5px] font-medium text-indigo-700 dark:text-indigo-300">Fix mobile navbar</span></div>
    </div>
  </div>
);

const AnalyticsPreview = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] p-4">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Velocity</p>
      <div className="flex items-end gap-1 h-20">
        {[30, 45, 40, 60, 55, 70, 85, 75, 90, 80, 95, 100, 85, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-emerald-500/60" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] p-4">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Priority Mix</p>
      <div className="space-y-2">
        <Bar label="Low" pct={20} color="bg-gray-400" />
        <Bar label="Medium" pct={45} color="bg-blue-500" />
        <Bar label="High" pct={25} color="bg-amber-500" />
        <Bar label="Urgent" pct={10} color="bg-red-500" />
      </div>
    </div>
  </div>
);

const Bar = ({ label, pct, color }) => (
  <div>
    <div className="flex justify-between text-[10.5px] mb-1"><span className="text-gray-600 dark:text-gray-400">{label}</span><span className="text-gray-900 dark:text-white font-medium">{pct}%</span></div>
    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
  </div>
);

// =============================================================
// KANBAN PREVIEW
// =============================================================
const KanbanPreview = () => {
  const columns = [
    { label: 'To do', dot: 'bg-gray-400', tasks: [{ title: 'Build product page', priority: 'bg-amber-500', tag: 'frontend' }, { title: 'Create checkout API', priority: 'bg-red-500', tag: 'backend' }, { title: 'Setup CI pipeline', priority: 'bg-gray-400', tag: 'devops' }] },
    { label: 'In progress', dot: 'bg-blue-500', tasks: [{ title: 'Fix mobile navbar', priority: 'bg-amber-500', tag: 'bug' }, { title: 'Implement wishlist', priority: 'bg-blue-500', tag: 'feature' }] },
    { label: 'Review', dot: 'bg-amber-500', tasks: [{ title: 'Refactor auth flow', priority: 'bg-amber-500', tag: 'refactor' }] },
    { label: 'Done', dot: 'bg-emerald-500', tasks: [{ title: 'Setup Postgres', priority: 'bg-emerald-500', tag: 'infra', done: true }, { title: 'Design system', priority: 'bg-emerald-500', tag: 'ui', done: true }] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {columns.map((col) => (
        <div key={col.label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{col.label}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-600">{col.tasks.length}</span>
          </div>
          <div className="space-y-2">
            {col.tasks.map((task) => (
              <div key={task.title} className="rounded-lg border border-gray-100 dark:border-white/[0.05] bg-gray-50/70 dark:bg-white/[0.02] p-2.5 text-[11px] leading-tight">
                <p className={`font-medium mb-1.5 ${task.done ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{task.title}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${task.priority}`} />
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">{task.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};