// -------------------------------------------------------------
// ProjectMembersModal - Manage who's on a project
// -------------------------------------------------------------
//
// PROPS:
//   isOpen         : boolean
//   onClose        : () => void
//   workspaceId    : string
//   projectId      : string
//   projectMembers : [{ id, userId, name, email, avatarUrl }]
//   allMembers     : [{ id, userId, name, email, avatarUrl, role }]
//                    (all workspace members)
//   currentUserId  : string
//
// DIFFING:
//   We compute "available to add" by diffing allMembers vs
//   projectMembers on userId. Simple and fast.
//
// ACTIONS:
//   - Add    → POST   /api/workspaces/[id]/projects/[projectId]/members
//   - Remove → DELETE /api/workspaces/[id]/projects/[projectId]/members/[userId]
//
// After every action, we call router.refresh() so the parent
// server component re-fetches. Simpler than juggling local
// state that could go stale.
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProjectMembersModal = ({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  projectMembers,
  allMembers,
  currentUserId,
}) => {
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Reset transient state when the modal opens.
  useEffect(() => {
    if (isOpen) {
      setBusyUserId(null);
      setError('');
    }
  }, [isOpen]);

  // Escape key closes (unless we're mid-request).
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' && !busyUserId) onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, busyUserId, onClose]);

  if (!isOpen) return null;

  // ─── Compute "available" list ───
  const projectUserIds = new Set(projectMembers.map((m) => m.userId));
  const availableMembers = allMembers.filter(
    (m) => !projectUserIds.has(m.userId)
  );

  // ─── Add member ───
  const handleAdd = async (userId) => {
    setBusyUserId(userId);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add member');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('[ADD_PROJECT_MEMBER]', err);
      setError('Network error. Please try again.');
    } finally {
      setBusyUserId(null);
    }
  };

  // ─── Remove member ───
  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this project?`)) return;

    setBusyUserId(userId);
    setError('');
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/members/${userId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove member');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('[REMOVE_PROJECT_MEMBER]', err);
      setError('Network error. Please try again.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !busyUserId && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project members
          </h2>
          <button
            onClick={onClose}
            disabled={!!busyUserId}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ─── Body (scrollable) ─── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* ─── Section: On this project ─── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              On this project ({projectMembers.length})
            </h3>

            {projectMembers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No members yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {projectMembers.map((m) => {
                  const isMe = m.userId === currentUserId;
                  const isBusy = busyUserId === m.userId;

                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <Avatar
                        name={m.name}
                        email={m.email}
                        image={m.avatarUrl}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {m.name || 'Unnamed'}
                          </p>
                          {isMe && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {m.email}
                        </p>
                      </div>

                      {!isMe && (
                        <button
                          onClick={() =>
                            handleRemove(m.userId, m.name || m.email)
                          }
                          disabled={isBusy}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 transition-colors flex-shrink-0"
                        >
                          {isBusy ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ─── Section: Add from workspace ─── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              Add from workspace ({availableMembers.length})
            </h3>

            {availableMembers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Everyone in the workspace is already on this project.
              </p>
            ) : (
              <ul className="space-y-1">
                {availableMembers.map((m) => {
                  const isBusy = busyUserId === m.userId;

                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <Avatar
                        name={m.name}
                        email={m.email}
                        image={m.avatarUrl}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {m.name || 'Unnamed'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {m.email}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAdd(m.userId)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-40 transition-colors flex-shrink-0"
                      >
                        {isBusy ? 'Adding...' : '+ Add'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ─── Footer ─── */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            disabled={!!busyUserId}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// Avatar - consistent user avatar (image or initials)
// =============================================================
const Avatar = ({ name, email, image }) => {
  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
};

export default ProjectMembersModal;