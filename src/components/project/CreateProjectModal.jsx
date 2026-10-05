// -------------------------------------------------------------
// CreateProjectModal - Create a new project
// -------------------------------------------------------------
//
// PROPS:
//   isOpen      : boolean
//   onClose     : () => void
//   workspaceId : string
//   onCreated   : (project) => void    // optional
//
// FLOW:
//   1. User types name, optional description, picks a color
//   2. Client validates with Zod
//   3. POST /api/workspaces/[id]/projects
//   4. Success → redirect to the new project detail page
//   5. Error   → show banner
//
// DESIGN:
//   - Live preview: color swatch + initial avatar
//   - Preset color palette (no random colors)
//   - Enter submits, Escape closes
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { createProjectSchema } from '@/lib/validators/project';
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from '@/lib/project-colors';

const CreateProjectModal = ({ isOpen, onClose, workspaceId, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: DEFAULT_PROJECT_COLOR,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameRef = useRef(null);
  const router = useRouter();

  // Reset + focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', description: '', color: DEFAULT_PROJECT_COLOR });
      setErrors({});
      setServerError('');
      setLoading(false);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, loading, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleColor = (value) => {
    setForm((prev) => ({ ...prev, color: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    const parsed = createProjectSchema.safeParse(form);
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

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to create project');
        setLoading(false);
        return;
      }

      // Notify parent (optional)
      onCreated?.(data.project);

      // Redirect to the new project detail page
      router.push(`/workspaces/${workspaceId}/projects/${data.project.id}`);
      router.refresh();
    } catch (err) {
      console.error('[CREATE_PROJECT]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Live preview initials
  const initials = form.name.trim()
    ? form.name.trim().slice(0, 2).toUpperCase()
    : 'PR';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create project
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {serverError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-300">
                {serverError}
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 transition-colors"
              style={{ backgroundColor: form.color }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {form.name.trim() || 'Project preview'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {PROJECT_COLORS.find((c) => c.value === form.color)?.name || 'Custom'}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Name
            </label>
            <input
              ref={nameRef}
              id="project-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="NOVA E-Commerce"
              maxLength={60}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="project-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this project about?"
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {form.description.length}/300
            </p>
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => {
                const isSelected = form.color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleColor(c.value)}
                    className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-900 dark:ring-white scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                    aria-label={c.name}
                  >
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;