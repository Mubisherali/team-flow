// -------------------------------------------------------------
// useNotificationEffects - Desktop notify + sound + tab badge
// -------------------------------------------------------------
//
// USES:
//   - NotificationsContext (for unreadCount + latestArrival)
//
// SIDE EFFECTS:
//   1. Tab title → "(3) TeamFlow" when unread > 0
//   2. Sound     → plays on new arrival if soundEnabled
//   3. Desktop   → OS notification on arrival if desktopEnabled
//                  AND permission granted AND tab is hidden
//
// PREFERENCES:
//   Stored in localStorage under "tf.notif.prefs":
//     { sound: boolean, desktop: boolean }
//   Defaults: sound=true, desktop=false
//
// WHY localStorage:
//   Per-browser preference. Matches OS-level behavior (each
//   device decides). Not synced to the server.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const PREFS_KEY = 'tf.notif.prefs';
const SOUND_URL = '/sounds/notification.mp3';
// -------------------------------------------------------------
// Load prefs from localStorage
// -------------------------------------------------------------
function loadPrefs() {
  if (typeof window === 'undefined') {
    return { sound: true, desktop: false };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { sound: true, desktop: false };
    const parsed = JSON.parse(raw);
    return {
      sound: parsed.sound !== false,      // default true
      desktop: parsed.desktop === true,   // default false
    };
  } catch {
    return { sound: true, desktop: false };
  }
}

function savePrefs(prefs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Silently ignore — localStorage can fail in private mode
  }
}

// -------------------------------------------------------------
// Base64 → Uint8Array (not needed for now, but kept as util)
// -------------------------------------------------------------

export function useNotificationEffects({
  unreadCount,
  latestArrival,
  markRead,
}) {
  // ─── Preferences ───
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [desktopPermission, setDesktopPermission] = useState('default');

  // ─── Audio element (kept in a ref so we don't recreate) ───
  const audioRef = useRef(null);

  // ─── Track whether the user has interacted (autoplay gate) ───
  const hasInteractedRef = useRef(false);

  // -----------------------------------------------------------
  // INIT: check permission status, set up interaction listener
  // -----------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Read current OS notification permission
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission);
    }

    // Create the audio element once
    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio(SOUND_URL);
      audioRef.current.volume = 0.5;
      audioRef.current.preload = 'auto';
    }

    // Browsers block audio playback until the user interacts.
    // Listen for the first click/keydown to unlock playback.
    const markInteracted = () => {
      hasInteractedRef.current = true;
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
    };
    window.addEventListener('pointerdown', markInteracted);
    window.addEventListener('keydown', markInteracted);
    window.addEventListener('touchstart', markInteracted);

    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
    };
  }, []);

  // -----------------------------------------------------------
  // EFFECT 1 — Tab title badge
  // -----------------------------------------------------------
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const base = 'TeamFlow';
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;

    // Cleanup: reset title on unmount
    return () => {
      document.title = base;
    };
  }, [unreadCount]);

  // -----------------------------------------------------------
  // EFFECT 2 — Sound + desktop notification on arrival
  // -----------------------------------------------------------
  useEffect(() => {
    if (!latestArrival) return;

    const { id, message, link, isRead } = latestArrival;

    // ─── Sound ───
    if (prefs.sound && hasInteractedRef.current && audioRef.current) {
      try {
        // Reset to start in case it's already playing
        audioRef.current.currentTime = 0;
        const p = audioRef.current.play();
        // Some browsers return a promise; ignore rejections
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch {
        // Silently ignore audio failures
      }
    }

    // ─── Desktop notification ───
    // Only when:
    //   - User enabled it
    //   - Permission is granted
    //   - The tab is hidden (no point showing if they're looking at us)
    if (
      prefs.desktop &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.hidden
    ) {
      try {
        const notif = new Notification('TeamFlow', {
          body: message,
          icon: '/favicon.ico',
          tag: id, // collapses duplicates
        });

        notif.onclick = () => {
          window.focus();
          if (!isRead) markRead(id);
          if (link) window.location.href = link;
          notif.close();
        };
      } catch {
        // Some browsers throw if the notification is malformed
      }
    }
  }, [latestArrival, prefs.sound, prefs.desktop, markRead]);

  // -----------------------------------------------------------
  // TOGGLES
  // -----------------------------------------------------------
  const toggleSound = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, sound: !prev.sound };
      savePrefs(next);
      return next;
    });
  }, []);

  const toggleDesktop = useCallback(async () => {
    // Turning ON → ask for permission first
    if (!prefs.desktop) {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        // Browser doesn't support desktop notifications
        return;
      }

      // Ask for permission (or use current if already granted)
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
        setDesktopPermission(permission);
      }

      // Only enable if granted
      if (permission === 'granted') {
        setPrefs((prev) => {
          const next = { ...prev, desktop: true };
          savePrefs(next);
          return next;
        });
      }
      return;
    }

    // Turning OFF — just flip the pref
    setPrefs((prev) => {
      const next = { ...prev, desktop: false };
      savePrefs(next);
      return next;
    });
  }, [prefs.desktop]);

  return {
    // Prefs
    soundEnabled: prefs.sound,
    desktopEnabled: prefs.desktop,
    desktopPermission,

    // Toggles
    toggleSound,
    toggleDesktop,
  };
}