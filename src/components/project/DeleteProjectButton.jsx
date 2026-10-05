// -------------------------------------------------------------
// DeleteProjectButton - Danger zone delete + confirm modal
// -------------------------------------------------------------
//
// REQUIRES TYPING THE PROJECT NAME to enable the delete button.
// Same pattern as deleting a workspace.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DeleteProjectButton = ({ workspaceId, projectId, projectName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const canDelete = confirmText.trim() === projectName.trim();

  const handleOpen = () => {
    setIsOpen(true);
    setConfirmText('');
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setConfirmText('');
      setError('');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete project');
        setLoading(false);
        return;
      }

      // Redirect back to the workspace dashboard
      router.push(`/workspaces/${workspaceId}`);
      router.refresh();
    } catch (err) {
      console.error('[DELETE_PROJECT]', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex-shrink-0"
      >
        Delete project
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-red-600 dark:text-red-400"
                  >
                    <path
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete project
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will permanently delete{' '}
                <strong className="text-gray-900 dark:text-white">
                  {projectName}
                </strong>{' '}
                and all its tasks. Members will remain in the workspace. This
                cannot be undone.
              </p>

              <div>
                <label
                  htmlFor="confirm-delete"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Type{' '}
                  <span className="font-mono text-red-600 dark:text-red-400">
                    {projectName}
                  </span>{' '}
                  to confirm
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={projectName}
                  autoFocus
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || loading}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteProjectButton;