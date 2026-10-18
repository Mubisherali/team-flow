// -------------------------------------------------------------
// WorkspaceListClient - Grid of workspaces + create modal
// -------------------------------------------------------------
//
// PHASE 11 (Global Search):
//   Listens for ?new=true to auto-open the Create Workspace modal.
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // <-- ADDED
import { motion } from 'framer-motion';

import CreateWorkspaceModal from './CreateWorkspaceModal';

// -------------------------------------------------------------
// ANIMATION VARIANTS
// -------------------------------------------------------------
const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// -------------------------------------------------------------
// MAIN
// -------------------------------------------------------------
const WorkspaceListClient = ({ initialWorkspaces }) => {
  const router = useRouter();
  const searchParams = useSearchParams(); // <-- ADDED

  // ─── Check URL for ?new=true ───
  const shouldOpenCreate = searchParams.get('new') === 'true';
  
  const [isModalOpen, setIsModalOpen] = useState(shouldOpenCreate);

  // ─── Clean the URL after opening ───
  useEffect(() => {
    if (shouldOpenCreate) {
      router.replace('/workspaces', { scroll: false });
    }
  }, [shouldOpenCreate, router]);

  const handleCreated = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const isEmpty = initialWorkspaces.length === 0;

  return (
    <>
      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Workspaces
          </h1>
          <p className="text-[13.5px] text-gray-500 dark:text-gray-400 mt-1">
            {isEmpty
              ? 'Create your first workspace to get started'
              : `${initialWorkspaces.length} workspace${initialWorkspaces.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="
            inline-flex items-center justify-center gap-2
            px-4 py-2.5 rounded-xl
            bg-indigo-600 hover:bg-indigo-700
            text-white text-[13px] font-medium
            active:scale-[0.98]
            transition-all duration-200
            shadow-sm shadow-indigo-500/20
            self-start sm:self-auto
          "
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New workspace
        </button>
      </div>

      {/* ══════════ CONTENT ══════════ */}
      {isEmpty ? (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={gridVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {initialWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}

          {/* Dashed "create" card */}
          <CreateCard onClick={() => setIsModalOpen(true)} />
        </motion.div>
      )}

      {/* ══════════ MODAL ══════════ */}
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
const WorkspaceCard = ({ workspace }) => {
  return (
    <motion.div variants={cardVariants}>
      <Link
        href={`/workspaces/${workspace.id}`}
        className="
          group flex flex-col h-full
          rounded-2xl
          border border-gray-200 dark:border-white/[0.06]
          bg-white dark:bg-white/[0.02]
          p-5
          min-h-[190px]
          hover:border-indigo-300 dark:hover:border-indigo-500/30
          hover:shadow-lg hover:shadow-indigo-500/5
          hover:-translate-y-0.5
          transition-all duration-200
        "
      >
        {/* Header: brand tile + role */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="relative">
            <div
              className="
                w-11 h-11 rounded-xl
                bg-gradient-to-br from-indigo-500 to-violet-600
                flex items-center justify-center
                text-white font-bold text-[13px]
                shadow-sm shadow-indigo-500/25
                ring-1 ring-black/5 dark:ring-white/[0.06]
                group-hover:scale-105
                transition-transform duration-200
              "
            >
              {workspace.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <RoleBadge role={workspace.role} />
        </div>

        {/* Name + slug */}
        <h3
          className="
            text-[15px] font-semibold text-gray-900 dark:text-white
            group-hover:text-indigo-600 dark:group-hover:text-indigo-400
            transition-colors truncate
          "
        >
          {workspace.name}
        </h3>
        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 font-mono truncate mb-2.5">
          /{workspace.slug}
        </p>

        {/* Description */}
        {workspace.description ? (
          <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {workspace.description}
          </p>
        ) : (
          <p className="text-[13px] text-gray-400 dark:text-gray-600 italic">
            No description
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats */}
        <div
          className="
            flex items-center gap-4
            pt-3 mt-3
            border-t border-gray-100 dark:border-white/[0.04]
            text-[11.5px] text-gray-500 dark:text-gray-500
          "
        >
          <Stat
            icon={
              <svg
                width="13"
                height="13"
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
            label={workspace.memberCount}
          />
          <Stat
            icon={
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            label={`${workspace.projectCount} project${workspace.projectCount === 1 ? '' : 's'}`}
          />
        </div>
      </Link>
    </motion.div>
  );
};

// =============================================================
// Stat - small icon + label pair in the card footer
// =============================================================
const Stat = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5">
    {icon}
    <span>{label}</span>
  </span>
);

// =============================================================
// CreateCard - dashed card at the end of the grid
// =============================================================
const CreateCard = ({ onClick }) => (
  <motion.div variants={cardVariants}>
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full h-full min-h-[190px]
        rounded-2xl
        border-2 border-dashed
        border-gray-200 dark:border-white/[0.08]
        p-6
        flex flex-col items-center justify-center gap-3
        hover:border-indigo-400 dark:hover:border-indigo-500/40
        hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.04]
        active:scale-[0.99]
        transition-all duration-200
      "
    >
      <div
        className="
          w-11 h-11 rounded-xl
          bg-gray-100 dark:bg-white/[0.04]
          text-gray-500 dark:text-gray-400
          group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/15
          group-hover:text-indigo-600 dark:group-hover:text-indigo-400
          flex items-center justify-center
          transition-colors duration-200
        "
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </div>
      <span
        className="
          text-[13px] font-medium
          text-gray-600 dark:text-gray-400
          group-hover:text-indigo-600 dark:group-hover:text-indigo-400
          transition-colors duration-200
        "
      >
        Create workspace
      </span>
    </button>
  </motion.div>
);

// =============================================================
// RoleBadge - Pill badge with a dot indicator
// =============================================================
const RoleBadge = ({ role }) => {
  const styles = {
    OWNER: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    MANAGER: {
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    MEMBER: {
      bg: 'bg-gray-100 dark:bg-white/[0.06]',
      text: 'text-gray-600 dark:text-gray-400',
      dot: 'bg-gray-400',
    },
  };

  const s = styles[role] || styles.MEMBER;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        text-[10px] font-semibold uppercase tracking-wider
        px-2 py-1 rounded-md
        ${s.bg} ${s.text}
        flex-shrink-0
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {role}
    </span>
  );
};

// =============================================================
// EmptyState - Shown when the user has no workspaces
// =============================================================
const EmptyState = ({ onCreateClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="
      relative overflow-hidden
      flex flex-col items-center justify-center
      py-20 px-4
      rounded-2xl
      border border-dashed border-gray-200 dark:border-white/[0.08]
      bg-white dark:bg-white/[0.02]
    "
  >
    {/* Soft radial glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.06),transparent_60%)]"
    />

    <div className="relative flex flex-col items-center">
      {/* Icon */}
      <div
        className="
          w-16 h-16 rounded-2xl
          bg-gradient-to-br from-indigo-500 to-violet-600
          flex items-center justify-center
          mb-5
          shadow-lg shadow-indigo-500/25
        "
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
        Create your first workspace
      </h3>
      <p className="text-[13.5px] text-gray-500 dark:text-gray-400 mb-7 text-center max-w-md leading-relaxed">
        A workspace is where your team collaborates — projects, tasks, and
        members all live inside one.
      </p>

      <button
        type="button"
        onClick={onCreateClick}
        className="
          group inline-flex items-center gap-2
          px-5 py-2.5 rounded-xl
          bg-indigo-600 hover:bg-indigo-700
          text-white text-[13px] font-medium
          active:scale-[0.98]
          transition-all duration-200
          shadow-lg shadow-indigo-500/25
        "
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Create workspace
      </button>
    </div>
  </motion.div>
);

export default WorkspaceListClient;