// -------------------------------------------------------------
// ConnectedAccounts - Read-only list of sign-in methods
// -------------------------------------------------------------
//
// PROPS:
//   providers : string[] — e.g. ['credentials', 'google', 'github']
//   email     : string   — the account's email
//
// WHAT IT SHOWS:
//   One row per provider with:
//     - Provider icon
//     - Provider label
//     - The email used
//     - A subtle "Connected" badge
//
// WHAT IT DOESN'T DO (yet):
//   - No "connect new provider" button — planned
//   - No "disconnect" button — risky without re-auth, planned
//
// SERVES AS:
//   - Reassurance (user sees what's linked)
//   - Foundation for future account-linking UI
// -------------------------------------------------------------

const PROVIDER_META = {
  credentials: {
    label: 'Email & password',
    render: () => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-700 dark:text-gray-300"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  google: {
    label: 'Google',
    render: () => (
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
    ),
  },
  github: {
    label: 'GitHub',
    render: () => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-gray-900 dark:text-white"
      >
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
};

// Fallback for any provider not in the map (future providers)
const fallbackMeta = (provider) => ({
  label: provider.charAt(0).toUpperCase() + provider.slice(1),
  render: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-gray-500 dark:text-gray-400"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
});

const ConnectedAccounts = ({ providers, email }) => {
  // If somehow empty, show a fallback row (shouldn't happen).
  const safeProviders = Array.isArray(providers) ? providers : [];

  if (safeProviders.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        No sign-in methods found.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800 -my-3">
      {safeProviders.map((provider) => {
        const meta = PROVIDER_META[provider] || fallbackMeta(provider);

        return (
          <li
            key={provider}
            className="flex items-center gap-3 py-3"
          >
            {/* Provider icon (fixed-width container so labels align) */}
            <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {meta.render()}
            </div>

            {/* Label + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {meta.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {email}
              </p>
            </div>

            {/* Connected badge */}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full flex-shrink-0">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Connected
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default ConnectedAccounts;