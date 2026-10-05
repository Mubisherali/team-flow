// -------------------------------------------------------------
// ProjectSettingsForm - Rename + description + color
// -------------------------------------------------------------
//
// PROPS:
//   workspaceId         : string
//   projectId           : string
//   initialName         : string
//   initialDescription  : string
//   initialColor        : string
//
// FEATURES:
//   - Live preview (avatar + color)
//   - Preset color picker
//   - Dirty tracking (Save disabled when nothing changed)
//   - Success/error banner
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { updateProjectSchema } from '@/lib/validators/project';
import { PROJECT_COLORS } from '@/lib/project-colors';

const ProjectSettingsForm = ({
  workspaceId,
  projectId,
  initialName,
  initialDescription,
  initialColor,
}) => {
  const [form, setForm] = useState({
    name: initialName,
    description: initialDescription,
    color: initialColor,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Detect unsaved changes
  const isDirty =
    form.name !== initialName ||
    form.description !== initialDescription ||
    form.color !== initialColor;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleColor = (value) => {
    setForm((prev) => ({ ...prev, color: value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: '', message: '' });
    setLoading(true);

    const parsed = updateProjectSchema.safeParse(form);
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
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to save' });
        setLoading(false);
        return;
      }

      setStatus({ type: 'success', message: 'Changes saved' });
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error('[PROJECT_SETTINGS]', err);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  const initials = form.name.trim()
    ? form.name.trim().slice(0, 2).toUpperCase()
    : 'PR';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {status.message && (
        <div
          className={`p-3 rounded-lg border text-sm ${
            status.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {status.message}
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
            {form.name || 'Project name'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {PROJECT_COLORS.find((c) => c.value === form.color)?.name || 'Custom'}
          </p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          maxLength={60}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
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

      {/* Color */}
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

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {isDirty && !loading && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Unsaved changes
          </span>
        )}
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

export default ProjectSettingsForm;