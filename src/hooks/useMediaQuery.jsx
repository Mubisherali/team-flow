// -------------------------------------------------------------
// useMediaQuery - Track whether a CSS media query matches
// -------------------------------------------------------------
//
// WHY THIS EXISTS:
//   Tailwind handles responsive styling via classes. But some
//   behaviors (like the mobile drawer's open/close state, or
//   showing a top bar with a user menu) need JavaScript to
//   decide whether to render or how to behave.
//
// USAGE:
//   const isMobile = useMediaQuery('(max-width: 1023px)');
//   const isDesktop = useMediaQuery('(min-width: 1024px)');
//
// SSR SAFETY:
//   On the server, matchMedia doesn't exist. We return `false`
//   by default. On the client, we sync immediately on mount.
//   This avoids hydration mismatches.
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia(query);

    // Sync initial value
    setMatches(mql.matches);

    // Listen for changes
    const handler = (e) => setMatches(e.matches);

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    // Fallback (older Safari)
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
}

// -------------------------------------------------------------
// Convenience presets — used across the app
// -------------------------------------------------------------

// Mobile + tablet (< 1024px) → drawer mode
export function useIsMobile() {
  return useMediaQuery('(max-width: 1023px)');
}

// Desktop (>= 1024px) → full sidebar
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}