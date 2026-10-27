// -------------------------------------------------------------
// WorkspaceListClient - Workspace grid + create modal
// -------------------------------------------------------------
//
// FEATURES:
//   - Opens create modal through ?new=true
//   - Cleans the URL after opening
//   - Refreshes server data after workspace creation
//   - Animated workspace cards
//   - Responsive grid and polished empty state
//   - Preserves existing workspace routes and modal props
// -------------------------------------------------------------

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import CreateWorkspaceModal from "./CreateWorkspaceModal";

// -------------------------------------------------------------
// ANIMATION VARIANTS
// -------------------------------------------------------------

const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

// -------------------------------------------------------------
// MAIN
// -------------------------------------------------------------

const WorkspaceListClient = ({ initialWorkspaces = [] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shouldOpenCreate = searchParams.get("new") === "true";

  const [isModalOpen, setIsModalOpen] = useState(shouldOpenCreate);

  // Open the modal from ?new=true and clean the URL.
  useEffect(() => {
    if (!shouldOpenCreate) return;

    setIsModalOpen(true);
    router.replace("/workspaces", { scroll: false });
  }, [shouldOpenCreate, router]);

  const handleCreated = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const isEmpty = initialWorkspaces.length === 0;

  return (
    <>
      <div className="space-y-8">
        {/* -------------------------------------------------- */}
        {/* HEADER                                             */}
        {/* -------------------------------------------------- */}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-6 bg-indigo-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-500 dark:text-indigo-300">
                Your organization
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-gray-950 dark:text-[#f5f5f0] sm:text-4xl">
              Workspaces
              <span className="ml-2 text-indigo-500 dark:text-indigo-400">
                .
              </span>
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500 dark:text-white/45">
              One place for your teams, projects, and everything you build
              together.
            </p>

            {!isEmpty && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 dark:border-white/[0.08] dark:bg-white/[0.025]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-gray-600 dark:text-white/60">
                  {initialWorkspaces.length} workspace
                  {initialWorkspaces.length === 1 ? "" : "s"} available
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="
              group inline-flex min-h-11 items-center justify-center gap-2.5
              self-start rounded-xl
              border border-indigo-500/20
              bg-indigo-600 px-4 py-2.5
              text-[12px] font-semibold text-white
              shadow-lg shadow-indigo-600/15
              transition-all duration-200
              hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-600/25
              active:translate-y-0 active:scale-[0.98]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-indigo-500 focus-visible:ring-offset-2
              focus-visible:ring-offset-white
              dark:focus-visible:ring-offset-[#0a0a0a]
              sm:self-auto
            "
          >
            <PlusIcon className="transition-transform duration-200 group-hover:rotate-90" />
            New workspace
            <ArrowUpRightIcon className="ml-1 h-3.5 w-3.5 text-white/65 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </header>

        {/* -------------------------------------------------- */}
        {/* SECTION LABEL                                      */}
        {/* -------------------------------------------------- */}

        {!isEmpty && (
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-white/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-white/40">
              All workspaces
            </p>

            <span className="font-mono text-[10px] text-gray-400 dark:text-white/25">
              {String(initialWorkspaces.length).padStart(2, "0")}{" "}
              {initialWorkspaces.length === 1 ? "ITEM" : "ITEMS"}
            </span>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* CONTENT                                            */}
        {/* -------------------------------------------------- */}

        {isEmpty ? (
          <EmptyState onCreateClick={() => setIsModalOpen(true)} />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={gridVariants}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {initialWorkspaces.map((workspace, index) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                index={index}
              />
            ))}

            <CreateCard onClick={() => setIsModalOpen(true)} />
          </motion.div>
        )}

        {/* -------------------------------------------------- */}
        {/* FOOTER                                             */}
        {/* -------------------------------------------------- */}

        {!isEmpty && (
          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
            <span className="text-[10px] tracking-wide text-gray-400 dark:text-white/25">
              Built for better collaboration
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
          </div>
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* CREATE MODAL                                       */}
      {/* -------------------------------------------------- */}

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
};

// =============================================================
// WorkspaceCard
// =============================================================

const WorkspaceCard = ({ workspace, index }) => {
  const name = workspace.name || "Untitled workspace";
  const initials = name.trim().slice(0, 2).toUpperCase() || "WS";
  const memberCount = workspace.memberCount ?? 0;
  const projectCount = workspace.projectCount ?? 0;

  const description =
    workspace.description?.trim() || "A shared space for your team's work.";

  return (
    <motion.div variants={cardVariants} className="h-full">
      <Link
        href={`/workspaces/${workspace.id}`}
        aria-label={`Open ${name} workspace`}
        className="
          group relative flex h-full min-h-[250px] flex-col overflow-hidden
          rounded-2xl border border-gray-200/90
          bg-white p-5
          transition-all duration-300
          hover:-translate-y-1 hover:border-indigo-300
          hover:shadow-xl hover:shadow-indigo-950/[0.05]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-indigo-500 focus-visible:ring-offset-2
          dark:border-white/[0.08] dark:bg-[#101010]
          dark:hover:border-indigo-400/35
          dark:hover:bg-[#121212] dark:hover:shadow-black/20
          dark:focus-visible:ring-offset-[#0a0a0a]
          sm:p-5
        "
      >
        {/* Ambient hover glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute -right-20 -top-24
            h-48 w-48 rounded-full
            bg-indigo-500/[0.06] blur-3xl
            transition-opacity duration-300
            group-hover:bg-indigo-500/[0.12]
          "
        />

        {/* Top row */}
        <div className="relative flex items-start justify-between gap-3">
          <div
            className="
              relative flex h-12 w-12 shrink-0 items-center justify-center
              overflow-hidden rounded-xl
              border border-indigo-500/15
              bg-gradient-to-br from-indigo-500 to-violet-700
              text-sm font-bold tracking-wide text-white
              shadow-md shadow-indigo-600/15
              transition-transform duration-300
              group-hover:scale-[1.04]
            "
          >
            <span aria-hidden="true" className="absolute inset-0 bg-white/[0.08]" />
            <span className="relative">{initials}</span>
          </div>

          <div className="flex items-center gap-2">
            <RoleBadge role={workspace.role} />

            <span
              aria-hidden="true"
              className="
                flex h-8 w-8 items-center justify-center rounded-lg
                border border-gray-200 text-gray-400
                transition-all duration-200
                group-hover:border-indigo-500/20
                group-hover:bg-indigo-500/5 group-hover:text-indigo-500
                dark:border-white/[0.08] dark:text-white/35
                dark:group-hover:border-indigo-400/20
                dark:group-hover:bg-indigo-400/[0.08]
                dark:group-hover:text-indigo-300
              "
            >
              <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        {/* Workspace details */}
        <div className="relative mt-5 min-w-0">
          <h2
            className="
              truncate text-[16px] font-semibold tracking-[-0.025em]
              text-gray-950 transition-colors duration-200
              group-hover:text-indigo-600
              dark:text-[#f5f5f0] dark:group-hover:text-indigo-300
            "
          >
            {name}
          </h2>

          {workspace.slug && (
            <p className="mt-1.5 truncate font-mono text-[10px] tracking-wide text-gray-400 dark:text-white/30">
              /{workspace.slug}
            </p>
          )}

          <p className="mt-3 line-clamp-2 min-h-[40px] text-[12px] leading-5 text-gray-500 dark:text-white/45">
            {description}
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Card footer */}
        <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.07]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Stat
              icon={<UsersIcon />}
              label={`${memberCount} ${memberCount === 1 ? "member" : "members"}`}
            />

            <Stat
              icon={<FolderIcon />}
              label={`${projectCount} ${projectCount === 1 ? "project" : "projects"}`}
            />
          </div>

          <span className="shrink-0 font-mono text-[9px] text-gray-300 dark:text-white/20">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

// =============================================================
// Stat
// =============================================================

const Stat = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5 text-[10.5px] text-gray-500 dark:text-white/40">
    <span className="shrink-0 text-gray-400 dark:text-white/35">{icon}</span>
    <span>{label}</span>
  </span>
);

// =============================================================
// CreateCard
// =============================================================

const CreateCard = ({ onClick }) => (
  <motion.div variants={cardVariants} className="h-full">
    <button
      type="button"
      onClick={onClick}
      className="
        group relative flex min-h-[250px] w-full flex-col items-center
        justify-center overflow-hidden rounded-2xl
        border border-dashed border-gray-300
        bg-transparent p-6 text-center
        transition-all duration-300
        hover:border-indigo-400 hover:bg-indigo-50/40
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        dark:border-white/[0.12] dark:hover:border-indigo-400/40
        dark:hover:bg-indigo-500/[0.035]
        dark:focus-visible:ring-offset-[#0a0a0a]
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 opacity-0
          transition-opacity duration-300
          group-hover:opacity-100
          bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_65%)]
        "
      />

      <span
        className="
          relative flex h-12 w-12 items-center justify-center rounded-xl
          border border-gray-200 bg-white text-gray-500
          shadow-sm transition-all duration-300
          group-hover:scale-105 group-hover:border-indigo-300
          group-hover:bg-indigo-50 group-hover:text-indigo-600
          dark:border-white/[0.09] dark:bg-white/[0.035]
          dark:text-white/45 dark:group-hover:border-indigo-400/25
          dark:group-hover:bg-indigo-400/10 dark:group-hover:text-indigo-300
        "
      >
        <PlusIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
      </span>

      <span className="relative mt-4 text-[13px] font-semibold text-gray-800 transition-colors group-hover:text-indigo-600 dark:text-white/80 dark:group-hover:text-indigo-300">
        Create a workspace
      </span>

      <span className="relative mt-1.5 max-w-[220px] text-[11px] leading-5 text-gray-500 dark:text-white/35">
        Start a new space for your team and projects.
      </span>

      <span className="relative mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 dark:text-indigo-300">
        Get started
        <ArrowUpRightIcon className="h-3 w-3" />
      </span>
    </button>
  </motion.div>
);

// =============================================================
// RoleBadge
// =============================================================

const ROLE_STYLES = {
  OWNER: {
    label: "Owner",
    classes:
      "border-amber-500/15 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  MANAGER: {
    label: "Manager",
    classes:
      "border-blue-500/15 bg-blue-500/[0.08] text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  MEMBER: {
    label: "Member",
    classes:
      "border-gray-300 bg-gray-100/80 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50",
    dot: "bg-gray-400",
  },
};

const RoleBadge = ({ role }) => {
  const style = ROLE_STYLES[role] || ROLE_STYLES.MEMBER;

  return (
    <span
      className={`
        inline-flex shrink-0 items-center gap-1.5 rounded-md
        border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em]
        ${style.classes}
      `}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

// =============================================================
// EmptyState
// =============================================================

const EmptyState = ({ onCreateClick }) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="
      relative flex min-h-[390px] flex-col items-center justify-center
      overflow-hidden rounded-2xl border border-gray-200
      bg-white px-5 py-14 text-center
      dark:border-white/[0.08] dark:bg-[#101010]
      sm:px-10
    "
  >
    {/* Ambient background */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(99,102,241,0.10),transparent_55%)]"
    />

    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
    />

    <div className="relative flex max-w-md flex-col items-center">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        A fresh start
      </span>

      <div className="relative mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500 to-violet-700 shadow-xl shadow-indigo-600/20">
        <div className="absolute inset-0 rounded-2xl bg-white/[0.07]" />
        <WorkspaceIcon className="relative h-8 w-8 text-white" />
      </div>

      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-[#f5f5f0] sm:text-3xl">
        Your team starts here.
      </h2>

      <p className="mt-3 text-[13px] leading-6 text-gray-500 dark:text-white/45">
        Create a workspace to bring your members, projects, and tasks together
        in one organized place.
      </p>

      <button
        type="button"
        onClick={onCreateClick}
        className="
          group mt-7 inline-flex min-h-11 items-center justify-center gap-2.5
          rounded-xl bg-indigo-600 px-5 py-3
          text-[12px] font-semibold text-white
          shadow-lg shadow-indigo-600/20
          transition-all duration-200
          hover:-translate-y-0.5 hover:bg-indigo-500
          hover:shadow-indigo-600/30
          active:translate-y-0 active:scale-[0.98]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-indigo-500 focus-visible:ring-offset-2
          focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#101010]
        "
      >
        <PlusIcon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
        Create your workspace
        <ArrowUpRightIcon className="ml-1 h-3.5 w-3.5 text-white/65 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>

      <p className="mt-4 text-[10px] text-gray-400 dark:text-white/25">
        Set up your space in just a few steps.
      </p>
    </div>
  </motion.section>
);

// =============================================================
// Inline SVG icons — no additional icon dependency required
// =============================================================

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function WorkspaceIcon({ className = "h-8 w-8" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export default WorkspaceListClient;
