// -------------------------------------------------------------
// NotificationSound - Plays a soft chime on new notifications
// -------------------------------------------------------------
//
// WHEN USED:
//   Mounted once in the app. Renders nothing.
//
// SCOPE (SIMPLEST VERSION):
//   Just play a sound. No prefs, no toggles, no persistence.
//   The context reads soundEnabled — we honor it here.
//
// HOW IT WORKS:
//   - Reads latestArrival + soundEnabled from notifications ctx
//   - Plays /sounds/notification.mp3 when a new arrival happens
//   - Waits for the first user interaction (browsers block
//     autoplay until then)
//
// POLISH:
//   - Respects soundEnabled from context (was missing)
//   - Cleans up audio element on unmount
//   - Header format aligned
//
// PRESERVED:
//   - Context reads (latestArrival)
//   - Audio element creation + volume + preload
//   - Unlock-on-first-interaction pattern
//   - Silent catch on play() failure
// -------------------------------------------------------------

'use client';

import { useEffect, useRef } from 'react';

import { useNotificationsCtx } from '@/context/NotificationsContext';

const SOUND_URL = '/sounds/notification.mp3';

const NotificationSound = () => {
  const { latestArrival, soundEnabled } = useNotificationsCtx();

  const audioRef = useRef(null);
  const unlockedRef = useRef(false);

  // ─── Create the audio element once, listen for unlock ───
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(SOUND_URL);
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;

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
      audioRef.current = null;
    };
  }, []);

  // ─── Play on new arrival (only if sound is enabled) ───
  useEffect(() => {
    if (!latestArrival) return;
    if (!soundEnabled) return;
    if (!unlockedRef.current) return;
    if (!audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      const p = audioRef.current.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      // Silent failure
    }
  }, [latestArrival, soundEnabled]);

  return null;
};

export default NotificationSound;