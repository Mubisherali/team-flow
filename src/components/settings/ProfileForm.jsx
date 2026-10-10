// -------------------------------------------------------------
// ProfileForm - Edit name + avatar
// -------------------------------------------------------------
//
// PROPS:
//   initialName      : string
//   initialAvatarUrl : string (empty string if none)
//   email            : string (read-only display)
//
// FLOW:
//   1. Avatar upload: click → file picker → upload to Cloudinary
//      → update local state with new URL → mark dirty
//   2. Name: type → update local state → mark dirty
//   3. Save: PATCH /api/users/me with the changed fields
//
// WHY UPLOAD IMMEDIATELY (not on Save):
//   - Instant preview feedback
//   - If upload fails, we show the error right away
//   - Save handles just the metadata (name, avatarUrl)
//
// WHY NOT SAVE IMMEDIATELY ON UPLOAD:
//   The user might upload, then change their mind and close.
//   We upload the file to Cloudinary (small cost), but only
//   persist the URL to our DB on Save.
//   Orphaned Cloudinary files are cheap (25 GB free).
// -------------------------------------------------------------

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateProfileSchema } from "@/lib/validators/user";
import { uploadImage, UPLOAD_RULES } from "@/lib/upload";

const ProfileForm = ({ initialName, initialAvatarUrl, email }) => {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

   const fileInputRef = useRef(null);
  const router = useRouter();
  const { update } = useSession();

  // Unsaved changes?
  const isDirty = name !== initialName || avatarUrl !== initialAvatarUrl;

  // -----------------------------------------------------------
  // AVATAR UPLOAD
  // -----------------------------------------------------------
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be selected again later.
    e.target.value = "";

    if (!file) return;

    setUploadError("");
    setUploading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await uploadImage(file, { folder: "teamflow/avatars" });
      setAvatarUrl(result.secureUrl);
      // Don't auto-save — the user can review and click Save.
    } catch (err) {
      console.error("[AVATAR_UPLOAD]", err);
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (!confirm("Remove your profile picture?")) return;
    setAvatarUrl("");
    setUploadError("");
    setStatus({ type: "", message: "" });
  };

  // -----------------------------------------------------------
  // SUBMIT
  // -----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: "", message: "" });
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
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Failed to save" });
        setSaving(false);
        return;
      }

      setStatus({ type: "success", message: "Profile updated" });
      setSaving(false);

      // Refresh the JWT so the new name/image are available
      // everywhere the session is read (sidebar, user menu, etc.).
      if (typeof update === "function") {
        await update({
          name: parsed.data.name,
          image: parsed.data.avatarUrl,
        });
      }

      // Refresh server components (layout re-reads the session).
      router.refresh();
    } catch (err) {
      console.error("[PROFILE_SAVE]", err);
      setStatus({ type: "error", message: "Network error. Please try again." });
      setSaving(false);
    }
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  const initials = (name || email || "?")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Status banner */}
      {status.message && (
        <div
          className={`p-3 rounded-lg border text-sm ${
            status.type === "success"
              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* ─── Avatar ─── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {uploading ? "Uploading..." : "Upload new photo"}
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {UPLOAD_RULES.description}
            </p>

            {uploadError && (
              <p className="text-xs text-red-600 mt-1">{uploadError}</p>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_RULES.allowedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* ─── Name ─── */}
      <div>
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
            if (status.message) setStatus({ type: "", message: "" });
          }}
          maxLength={50}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && (
          <p className="text-xs text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      {/* ─── Email (read-only) ─── */}
      <div>
        <label
          htmlFor="profile-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Email changes are not supported yet.
        </p>
      </div>

      {/* ─── Save ─── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {isDirty && !saving && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Unsaved changes
          </span>
        )}
        <button
          type="submit"
          disabled={saving || uploading || !isDirty}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
