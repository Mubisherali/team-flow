// -------------------------------------------------------------
// Register Page - Polished
// -------------------------------------------------------------
//
// STRUCTURE:
//   - Brand mark
//   - Heading + subtitle
//   - Server error banner (dismissible)
//   - OAuth buttons (Google, GitHub)
//   - Divider
//   - Credentials form (name, email, password, confirm)
//     with password visibility toggles + strength meter
//   - Footer (login link)
//
// MOTION:
//   - Card fade + slide on mount
//   - Error banner slide open
//
// MICRO-INTERACTIONS:
//   - Buttons hover + active scale
//   - Password eye toggle
//   - Live password strength
// -------------------------------------------------------------

'use client';

import { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

import { registerSchema } from '@/lib/validators/auth';

// -------------------------------------------------------------
// INPUT STYLES
// -------------------------------------------------------------
const inputBase = `
  w-full px-3.5 py-2.5 rounded-xl text-sm
  border bg-white dark:bg-white/[0.03]
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-gray-500
  focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
  transition-all duration-200
  disabled:opacity-60
`;
const inputNormal =
  'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]';
const inputErrorState =
  'border-red-300 dark:border-red-900 focus:ring-red-500/60 focus:border-red-500';

// -------------------------------------------------------------
// PASSWORD STRENGTH
// -------------------------------------------------------------
// Simple heuristic: length + character variety.
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };

  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  // Clamp to 0-4 for display
  const level = Math.min(score, 4);

  const map = {
    0: { label: 'Too short', color: 'bg-red-500', text: 'text-red-600' },
    1: { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' },
    2: { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' },
    3: { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' },
    4: { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
  };

  return { score: level, ...map[level] };
}

// -------------------------------------------------------------
// REGISTER FORM
// -------------------------------------------------------------
const RegisterForm = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const nameRef = useRef(null);
  const router = useRouter();

  // ─── Auto-focus name on mount ───
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // ─── Live password strength ───
  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    const parsed = registerSchema.safeParse(form);
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      const signInResult = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError('Account created but login failed. Please log in.');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('[REGISTER_FORM]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setServerError('');
    await signIn('google', { callbackUrl: '/' });
  };

  const handleGithub = async () => {
    setServerError('');
    await signIn('github', { callbackUrl: '/' });
  };

  return (
    <>
      {/* ─── Server Error Banner ─── */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <p className="text-[13px] text-red-700 dark:text-red-300 flex-1">
                {serverError}
              </p>
              <button
                type="button"
                onClick={() => setServerError('')}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                aria-label="Dismiss error"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Google Button ─── */}
      <button
        type="button"
        onClick={handleGoogle}
        className="
          w-full flex items-center justify-center gap-3
          py-2.5 rounded-xl
          border border-gray-200 dark:border-white/[0.08]
          bg-white dark:bg-white/[0.03]
          text-gray-700 dark:text-gray-200
          text-sm font-medium
          hover:bg-gray-50 dark:hover:bg-white/[0.06]
          hover:border-gray-300 dark:hover:border-white/[0.12]
          active:scale-[0.99]
          transition-all duration-200
        "
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* ─── GitHub Button ─── */}
      <button
        type="button"
        onClick={handleGithub}
        className="
          w-full mt-3 flex items-center justify-center gap-3
          py-2.5 rounded-xl
          border border-gray-900 dark:border-white/[0.08]
          bg-gray-900 dark:bg-white/[0.03]
          text-white dark:text-gray-100
          text-sm font-medium
          hover:bg-gray-800 dark:hover:bg-white/[0.06]
          active:scale-[0.99]
          transition-all duration-200
        "
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
        Continue with GitHub
      </button>

      {/* ─── Divider ─── */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-white dark:bg-[#0f1115] px-3 text-gray-500 dark:text-gray-500 font-medium">
            or
          </span>
        </div>
      </div>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Full name
          </label>
          <input
            ref={nameRef}
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Ahmed Khan"
            autoComplete="name"
            disabled={loading}
            className={`${inputBase} ${
              errors.name ? inputErrorState : inputNormal
            }`}
          />
          {errors.name && (
            <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            autoComplete="email"
            disabled={loading}
            className={`${inputBase} ${
              errors.email ? inputErrorState : inputNormal
            }`}
          />
          {errors.email && (
            <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters, 1 number"
              autoComplete="new-password"
              disabled={loading}
              className={`${inputBase} ${
                errors.password ? inputErrorState : inputNormal
              } pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength meter */}
          {form.password && !errors.password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`
                      h-1 flex-1 rounded-full transition-colors duration-300
                      ${
                        i < strength.score
                          ? strength.color
                          : 'bg-gray-200 dark:bg-white/[0.06]'
                      }
                    `}
                  />
                ))}
              </div>
              <p className={`text-[11px] font-medium ${strength.text}`}>
                {strength.label}
              </p>
            </div>
          )}

          {errors.password && (
            <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={loading}
              className={`${inputBase} ${
                errors.confirmPassword ? inputErrorState : inputNormal
              } pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-2.5 rounded-xl mt-2
            bg-indigo-600 hover:bg-indigo-700
            disabled:bg-indigo-400 disabled:cursor-not-allowed
            active:scale-[0.99]
            text-white text-sm font-medium
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* ─── Terms note ─── */}
      <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
        By continuing, you agree to our{' '}
        <Link
          href="/terms"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
        >
          Terms
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>

      {/* ─── Footer ─── */}
      <p className="text-center text-[13px] text-gray-600 dark:text-gray-400 mt-4">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          Log in
        </Link>
      </p>
    </>
  );
};

// -------------------------------------------------------------
// PAGE
// -------------------------------------------------------------
const RegisterPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="
        w-full
        bg-white dark:bg-[#0f1115]
        rounded-2xl
        border border-gray-200 dark:border-white/[0.08]
        shadow-xl shadow-black/5 dark:shadow-black/30
        p-6 sm:p-8
      "
    >
      {/* Brand mark */}
      <div className="flex justify-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="TeamFlow"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-white">
            TeamFlow
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Start managing projects with your team
        </p>
      </div>

      {/* Form (Suspense wrapper for safety / consistency) */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </motion.div>
  );
};

export default RegisterPage;