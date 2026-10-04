// -------------------------------------------------------------
// WorkspaceSettingsForm - Rename + description form
// -------------------------------------------------------------
//
// PROPS:
//   workspaceId         : string (DB id)
//   initialName         : string
//   initialDescription  : string
//
// FLOW:
//   1. User edits fields
//   2. Click "Save" → PATCH /api/workspaces/:id
//   3. On success → show "Saved" indicator + router.refresh()
//   4. On error   → show error banner
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { updateWorkspaceSchema } from '@/lib/validators/workspace';

const WorkspaceSettingsForm = ({
  workspaceId,
  initialName,
  initialDescription,
}) => {
  const [form, setForm] = useState({
    name: initialName,
    description: initialDescription,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Detect if there are unsaved changes (nice UX).
  const isDirty =
    form.name !== initialName ||
    form.description !== initialDescription;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: '', message: '' });
    setLoading(true);

    // Client-side validation
    const parsed = updateWorkspaceSchema.safeParse(form);
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
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to save changes',
        });
        setLoading(false);
        return;
      }

      setStatus({ type: 'success', message: 'Changes saved' });
      setLoading(false);

      // Refresh server data so the layout/sidebar reflect the new name.
      router.refresh();
    } catch (err) {
      console.error('[SETTINGS_FORM]', err);
      setStatus({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Status banner */}
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
          maxLength={50}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && (
          <p className="text-xs text-red-600 mt-1">{errors.name}</p>
        )}
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

      {/* Save button */}
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

export default WorkspaceSettingsForm;