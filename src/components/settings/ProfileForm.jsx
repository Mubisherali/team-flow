// -------------------------------------------------------------
// ProfileForm - Edit name + avatar
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the "General" card on the profile
//   settings page.
//
// STRUCTURE:
//   <form>
//     - Status banner (glass success / error)
//     - Avatar (preview + upload / remove controls)
//     - Name field
//     - Email field (read-only)
//     - Footer: dirty indicator + Save button
//
// POLISH:
//   - Glass status banner + auto-dismiss success after 2.5s
//   - Soft indigo focus ring on inputs
//   - Avatar preview gets ring + refined upload overlay
//   - Remove uses inline confirm (no native confirm())
//   - Upload button gets active:scale + focus ring
//   - Save button gets spinner + active:scale
//   - A11y: aria-labels, role=alert, aria-invalid
//
// PRESERVED:
//   - Props (initialName, initialAvatarUrl, email)
//   - State (name, avatarUrl, errors, status, saving,
//     uploading, uploadError)
//   - isDirty logic
//   - handleFileSelect / handleRemoveAvatar / handleSubmit
//   - Zod validation via updateProfileSchema
//   - PATCH /api/users/me
//   - session update() + router.refresh()
//   - Cloudinary upload via uploadImage
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

import { updateProfileSchema } from '@/lib/validators/user';
import { uploadImage, UPLOAD_RULES } from '@/lib/upload';

const ProfileForm = ({ initialName, initialAvatarUrl, email }) => {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);
  const router = useRouter();
  const { update } = useSession();

  // Unsaved changes?
  const isDirty = name !== initialName || avatarUrl !== initialAvatarUrl;

  // Auto-dismiss success banner
  useEffect(() => {
    if (status.type !== 'success') return;
    const t = setTimeout(() => setStatus({ type: '', message: '' }), 2500);
    return () => clearTimeout(t);
  }, [status]);

  // -----------------------------------------------------------
  // AVATAR UPLOAD
  // -----------------------------------------------------------
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be selected again later.
    e.target.value = '';

    if (!file) return;

    setUploadError('');
    setUploading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await uploadImage(file, { folder: 'teamflow/avatars' });
      setAvatarUrl(result.secureUrl);
      // Don't auto-save — the user can review and click Save.
    } catch (err) {
      console.error('[AVATAR_UPLOAD]', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setUploadError('');
    setStatus({ type: '', message: '' });
  };

  // -----------------------------------------------------------
  // SUBMIT
  // -----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: '', message: '' });
    setSaving(true);

    // Client-side validation
    const parsed = updateProfileSchema.safeParse({ name, avatarUrl });
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to save' });
        setSaving(false);
        return;
      }

      setStatus({ type: 'success', message: 'Profile updated' });
      setSaving(false);

      // Refresh the JWT so the new name/image are available
      // everywhere the session is read (sidebar, user menu, etc.).
      if (typeof update === 'function') {
        await update({
          name: parsed.data.name,
          image: parsed.data.avatarUrl,
        });
      }

      // Refresh server components (layout re-reads the session).
      router.refresh();
    } catch (err) {
      console.error('[PROFILE_SAVE]', err);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
      setSaving(false);
    }
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ─── Status banner ─── */}
      <AnimatePresence>
        {status.message && (
          <motion.div
            key={status.type}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className={`
              rounded-xl px-3.5 py-3 border
              ${
                status.type === 'success'
                  ? 'bg-emerald-500/[0.07] dark:bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/[0.07] dark:bg-red-500/10 border-red-500/20'
              }
            `}
          >
            <p
              className={`text-[12.5px] ${
                status.type === 'success'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {status.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Avatar ─── */}
      <div>
        <label className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-3">
          Profile picture
        </label>

        <div className="flex items-center gap-5">
          {/* Preview */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="
                  w-20 h-20 rounded-full object-cover
                  ring-1 ring-gray-200 dark:ring-white/[0.08]
                "
              />
            ) : (
              <div
                className="
                  w-20 h-20 rounded-full
                  bg-indigo-600 text-white
                  flex items-center justify-center
                  text-[24px] font-bold
                  ring-1 ring-indigo-500/20
                "
                aria-hidden="true"
              >
                {initials}
              </div>
            )}

            {uploading && (
              <div
                className="
                  absolute inset-0 rounded-full
                  bg-black/60 backdrop-blur-sm
                  flex items-center justify-center
                "
                aria-hidden="true"
              >
                <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="
                  inline-flex items-center gap-2
                  px-3 py-2 rounded-lg
                  border border-gray-300 dark:border-white/[0.08]
                  text-gray-700 dark:text-gray-300
                  text-[13px] font-medium
                  hover:bg-gray-50 dark:hover:bg-white/[0.04]
                  active:scale-[0.98]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {uploading ? 'Uploading…' : 'Upload new photo'}
              </button>

              {avatarUrl && !uploading && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="
                    inline-flex items-center px-3 py-2 rounded-lg
                    text-[13px] font-medium
                    text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-500/10
                    active:scale-[0.98]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
                    transition-all duration-150
                  "
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-2">
              {UPLOAD_RULES.description}
            </p>

            {uploadError && (
              <p
                role="alert"
                className="text-[11px] text-red-600 dark:text-red-400 mt-1.5"
              >
                {uploadError}
              </p>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_RULES.allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* ─── Name ─── */}
      <div>
        <label
          htmlFor="profile-name"
          className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            if (status.message) setStatus({ type: '', message: '' });
          }}
          maxLength={50}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`
            w-full px-3 py-2.5 rounded-xl
            text-[13px]
            bg-white dark:bg-white/[0.03]
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            border transition-all duration-150
            focus:outline-none
            focus:ring-2 focus:ring-indigo-500/20
            ${
              errors.name
                ? 'border-red-300 dark:border-red-500/40'
                : 'border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-500/60'
            }
          `}
        />
        {errors.name && (
          <p
            id="name-error"
            className="text-[11px] text-red-600 dark:text-red-400 mt-1.5"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* ─── Email (read-only) ─── */}
      <div>
        <label
          htmlFor="profile-email"
          className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          disabled
          className="
            w-full px-3 py-2.5 rounded-xl
            text-[13px]
            border border-gray-200 dark:border-white/[0.06]
            bg-gray-50 dark:bg-white/[0.02]
            text-gray-500 dark:text-gray-400
            cursor-not-allowed
          "
        />
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
          Email changes are not supported yet.
        </p>
      </div>

      {/* ─── Save ─── */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {isDirty && !saving && (
          <span className="text-[11.5px] text-gray-500 dark:text-gray-400">
            Unsaved changes
          </span>
        )}
        <button
          type="submit"
          disabled={saving || uploading || !isDirty}
          className="
            inline-flex items-center gap-2
            px-3.5 py-2 rounded-xl
            bg-indigo-600 hover:bg-indigo-700
            disabled:bg-gray-200 dark:disabled:bg-white/[0.06]
            disabled:text-gray-400 dark:disabled:text-gray-500
            disabled:cursor-not-allowed
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
            text-white text-[13px] font-medium
            transition-all duration-150
          "
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;