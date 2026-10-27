// -------------------------------------------------------------
// ProfileForm - Edit name and avatar
// -------------------------------------------------------------

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

import { updateProfileSchema } from "@/lib/validators/user";
import { uploadImage, UPLOAD_RULES } from "@/lib/upload";

export default function ProfileForm({
  initialName,
  initialAvatarUrl,
  email,
}) {
  const [name, setName] = useState(initialName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef(null);
  const router = useRouter();
  const { update } = useSession();

  const isDirty =
    name !== (initialName ?? "") ||
    avatarUrl !== (initialAvatarUrl ?? "");

  useEffect(() => {
    if (status.type !== "success") return;

    const timeout = setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [status]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadError("");
    setStatus({ type: "", message: "" });

    if (saving || uploading) return;

    setUploading(true);

    try {
      const result = await uploadImage(file, {
        folder: "teamflow/avatars",
      });

      if (!result?.secureUrl) {
        throw new Error("The uploaded image URL was not returned.");
      }

      setAvatarUrl(result.secureUrl);
      setErrors((previous) => ({
        ...previous,
        avatarUrl: undefined,
      }));
    } catch (err) {
      console.error("[AVATAR_UPLOAD]", err);
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (saving || uploading) return;

    setAvatarUrl("");
    setUploadError("");
    setStatus({ type: "", message: "" });
    setErrors((previous) => ({
      ...previous,
      avatarUrl: undefined,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || uploading) return;

    setErrors({});
    setStatus({ type: "", message: "" });

    const parsed = updateProfileSchema.safeParse({
      name,
      avatarUrl,
    });

    if (!parsed.success) {
      const fieldErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus({
          type: "error",
          message: data.error || "Unable to save your profile.",
        });
        return;
      }

      // Update the session so the new name and avatar are reflected
      // in components that read the NextAuth session.
      try {
        if (typeof update === "function") {
          await update({
            name: parsed.data.name,
            image: parsed.data.avatarUrl || null,
          });
        }
      } catch (sessionError) {
        console.error("[PROFILE_SESSION_UPDATE]", sessionError);
      }

      setStatus({
        type: "success",
        message: "Your profile has been updated.",
      });

      router.refresh();
    } catch (err) {
      console.error("[PROFILE_SAVE]", err);
      setStatus({
        type: "error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || email || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const inputClass = (invalid) =>
    `w-full rounded-xl border bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      invalid
        ? "border-red-400/40 focus:border-red-400/60 focus:ring-red-500/10"
        : "border-white/[0.09] focus:border-violet-400/50 focus:ring-violet-500/10"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <AnimatePresence mode="wait">
        {status.message && (
          <motion.div
            key={`${status.type}-${status.message}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
            role={status.type === "error" ? "alert" : "status"}
            aria-live={status.type === "error" ? "assertive" : "polite"}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              status.type === "success"
                ? "border-emerald-400/15 bg-emerald-400/[0.055]"
                : "border-red-400/15 bg-red-400/[0.055]"
            }`}
          >
            <span
              className={`mt-0.5 text-sm ${
                status.type === "success"
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
              aria-hidden="true"
            >
              {status.type === "success" ? "✓" : "!"}
            </span>
            <p
              className={`text-xs leading-5 ${
                status.type === "success"
                  ? "text-emerald-200"
                  : "text-red-200"
              }`}
            >
              {status.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <section>
        <div className="mb-3">
          <h3 className="text-[13px] font-medium text-zinc-200">
            Profile picture
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Personalize how your teammates see you.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile avatar preview"
                className="h-20 w-20 rounded-full border border-white/[0.1] object-cover ring-4 ring-white/[0.025]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-violet-300/15 bg-gradient-to-br from-violet-500/25 to-indigo-500/10 text-xl font-semibold text-violet-200 ring-4 ring-white/[0.025]" aria-label={`Avatar initials: ${initials}`}>
                {initials}
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65" role="status" aria-label="Uploading image">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-zinc-200">
              Your avatar
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {UPLOAD_RULES.description}
            </p>

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {uploading ? "Uploading..." : "Upload photo"}
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading || saving}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-400/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 disabled:opacity-50"
                >
                  Remove photo
                </button>
              )}
            </div>

            {uploadError && (
              <p role="alert" className="mt-2 text-xs leading-5 text-red-300">
                {uploadError}
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_RULES.allowedTypes.join(",")}
            onChange={handleFileSelect}
            disabled={uploading || saving}
            className="hidden"
            aria-label="Choose a profile photo"
          />
        </div>

        {errors.avatarUrl && (
          <p className="mt-2 text-xs text-red-300">{errors.avatarUrl}</p>
        )}
      </section>

      {/* Name */}
      <section>
        <label htmlFor="profile-name" className="mb-2 block text-xs font-medium text-zinc-300">
          Full name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((previous) => ({
              ...previous,
              name: undefined,
            }));
            setStatus({ type: "", message: "" });
          }}
          maxLength={50}
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "profile-name-error" : undefined}
          disabled={saving}
          className={inputClass(!!errors.name)}
          placeholder="Enter your name"
        />
        <div className="mt-1.5 flex items-center justify-between gap-3">
          {errors.name ? (
            <p id="profile-name-error" className="text-xs text-red-300">
              {errors.name}
            </p>
          ) : (
            <p className="text-[11px] text-zinc-600">
              This name is visible to your teammates.
            </p>
          )}
          <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
            {name.length}/50
          </span>
        </div>
      </section>

      {/* Email */}
      <section>
        <label htmlFor="profile-email" className="mb-2 block text-xs font-medium text-zinc-300">
          Email address
        </label>
        <div className="relative">
          <input
            id="profile-email"
            type="email"
            value={email || ""}
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-white/[0.015] px-3.5 py-3 pr-10 text-sm text-zinc-500 outline-none"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.7">
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-600">
          Your email address cannot be changed here.
        </p>
      </section>

      {/* Footer */}
      <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-xs">
          {isDirty && !saving && (
            <span className="inline-flex items-center gap-2 text-amber-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Unsaved changes
            </span>
          )}
          {!isDirty && (
            <span className="text-zinc-600">All changes saved</span>
          )}
        </div>

        <button
          type="submit"
          disabled={!isDirty || saving || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/20 transition-all hover:bg-violet-400 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.05] disabled:text-zinc-600 disabled:shadow-none"
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving changes...
            </>
          ) : (
            <>
              Save changes
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </footer>
    </form>
  );
}