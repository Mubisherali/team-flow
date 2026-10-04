// -------------------------------------------------------------
// WorkspaceListClient - Client wrapper for the workspaces page
// -------------------------------------------------------------
//
// WHY A CLIENT WRAPPER:
// The page is a server component that fetches data. But we
// need:
//   - Modal state (open/close)
//   - A "refresh" mechanism after creating a workspace
//   - Click handlers
//
// So we split: server fetches, client interacts.
//
// PROPS:
//   initialWorkspaces : array from the server
//
// REFRESH PATTERN:
// After creating a workspace, we do NOT mutate the array in
// place. Instead, we call router.refresh() which tells Next.js
// to re-run the server component (re-fetch from DB). Cleaner
// than manual state syncing.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import CreateWorkspaceModal from './CreateWorkspaceModal';

const WorkspaceListClient = ({ initialWorkspaces }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // ─── After creating a workspace ───
  // Close the modal and refresh the server component so the
  // new workspace appears. Optionally redirect to it.
  const handleCreated = (workspace) => {
    setIsModalOpen(false);
    // Option A: stay on list and see it appear
    router.refresh();
    // Option B: jump straight into the new workspace
    // router.push(`/workspaces/${workspace.id}`);
  };

  return (
    <>
      {/* ----- Page header ----- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workspaces
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {initialWorkspaces.length === 0
              ? 'Create your first workspace to get started'
              : `${initialWorkspaces.length} workspace${initialWorkspaces.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New workspace
        </button>
      </div>

      {/* ----- Content ----- */}
      {initialWorkspaces.length === 0 ? (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}

          {/* "Create" card at the end of the grid */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 min-h-[180px] hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 flex items-center justify-center transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Create workspace
            </span>
          </button>
        </div>
      )}

      {/* ----- Modal ----- */}
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
};

// =============================================================
// WorkspaceCard - Single workspace card
// =============================================================
const WorkspaceCard = ({ workspace }) => {
  return (
    <a
      href={`/workspaces/${workspace.id}`}
      className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 min-h-[180px] hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-md transition-all"
    >
      {/* Header: avatar + role badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {workspace.name.slice(0, 2).toUpperCase()}
        </div>
        <RoleBadge role={workspace.role} />
      </div>

      {/* Name + slug */}
      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
        {workspace.name}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mb-2">
        /{workspace.slug}
      </p>

      {/* Description */}
      {workspace.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {workspace.description}
        </p>
      )}

      {/* Spacer to push stats to bottom */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
          </svg>
          <span>{workspace.memberCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{workspace.projectCount} projects</span>
        </div>
      </div>
    </a>
  );
};

// =============================================================
// RoleBadge - Small badge showing OWNER / MANAGER / MEMBER
// =============================================================
const RoleBadge = ({ role }) => {
  const styles = {
    OWNER: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    MANAGER: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    MEMBER: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${styles[role] || styles.MEMBER}`}
    >
      {role}
    </span>
  );
};

// =============================================================
// EmptyState - Shown when the user has no workspaces
// =============================================================
const EmptyState = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600 dark:text-indigo-400">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No workspaces yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
        A workspace is where your team collaborates — projects, tasks, and members all live inside one.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Create your first workspace
      </button>
    </div>
  );
};

export default WorkspaceListClient;