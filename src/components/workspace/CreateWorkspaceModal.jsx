// -------------------------------------------------------------
// CreateWorkspaceModal - Form to create a new workspace
// -------------------------------------------------------------
//
// USAGE:
//   <CreateWorkspaceModal
//     isOpen={isOpen}
//     onClose={() => setIsOpen(false)}
//     onCreated={(workspace) => { ... }}
//   />
//
// FLOW:
//   1. User fills name + description
//   2. Client validates with Zod (instant feedback)
//   3. POST /api/workspaces
//   4. On success: call onCreated(workspace) + close modal
//   5. Parent (list page) can then refresh or redirect
//
// FEATURES:
//   - Live slug preview as the user types the name
//   - Escape key closes modal
//   - Click outside closes modal
//   - Loading state disables submit
//   - Field + server error display
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { createWorkspaceSchema } from '@/lib/validators/workspace';

// -------------------------------------------------------------
// LOCAL slugify - tiny copy for live preview
// -------------------------------------------------------------
// We don't import from lib/slug because that file pulls in
// Prisma (which can't run in the browser). This is a
// lightweight duplicate used ONLY for UI preview.
function previewSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

const CreateWorkspaceModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Ref to the name input so we can focus it when the modal opens.
  const nameInputRef = useRef(null);

  // -----------------------------------------------------------
  // RESET FORM WHEN MODAL OPENS
  // -----------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', description: '' });
      setErrors({});
      setServerError('');
      setLoading(false);
      // Focus the name field for fast typing.
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // -----------------------------------------------------------
  // ESC KEY CLOSES MODAL
  // -----------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // -----------------------------------------------------------
  // INPUT HANDLER
  // -----------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  // -----------------------------------------------------------
  // SUBMIT
  // -----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    // Client-side validation
    const parsed = createWorkspaceSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    // POST to API
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to create workspace');
        setLoading(false);
        return;
      }

      // Success → notify parent
      onCreated(data.workspace);
      setLoading(false);
    } catch (err) {
      console.error('[CREATE_WORKSPACE]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // EARLY RETURN — don't render anything if closed
  // -----------------------------------------------------------
  if (!isOpen) return null;

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()} // prevent backdrop click from closing
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create a workspace
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-300">
                {serverError}
              </p>
            </div>
          )}

          {/* Name field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Workspace name
            </label>
            <input
              ref={nameInputRef}
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="NOVA TECH"
              maxLength={50}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}

            {/* Live slug preview */}
            {form.name.trim().length >= 2 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                URL: <span className="font-mono">/workspaces/{previewSlug(form.name)}</span>
              </p>
            )}
          </div>

          {/* Description field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this workspace for?"
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {form.description.length}/200
            </p>
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;