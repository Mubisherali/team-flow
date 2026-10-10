// -------------------------------------------------------------
// NotificationSound - Plays a soft chime on new notifications
// -------------------------------------------------------------
//
// SCOPE (SIMPLEST VERSION):
//   Just play a sound. No prefs, no toggles, no persistence.
//   If we later want a user toggle, we add it on top.
//
// HOW IT WORKS:
//   - Reads latestArrival from the notifications context
//   - Plays /sounds/notification.mp3 when a new arrival happens
//   - Waits for the first user interaction (browsers block
//     autoplay until then)
//
// RENDERS NOTHING.
// -------------------------------------------------------------

'use client';

import { useEffect, useRef } from 'react';

import { useNotificationsCtx } from '@/context/NotificationsContext';

const SOUND_URL = '/sounds/notification.mp3';

const NotificationSound = () => {
  const { latestArrival } = useNotificationsCtx();

  const audioRef = useRef(null);
  const unlockedRef = useRef(false);

  // ─── Create the audio element once, listen for unlock ───
  useEffect(() => {
    if (typeof window === 'undefined') return;

    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 0.5;
    audioRef.current.preload = 'auto';

    const unlock = () => {
      unlockedRef.current = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // ─── Play on new arrival ───
  useEffect(() => {
    if (!latestArrival) return;
    if (!unlockedRef.current) return;
    if (!audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      const p = audioRef.current.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      // Silent failure
    }
  }, [latestArrival]);

  return null;
};

export default NotificationSound;