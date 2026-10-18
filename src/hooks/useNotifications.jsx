// -------------------------------------------------------------
// useNotifications - Adaptive polling hook + Sound Prefs
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const ACTIVE_POLL_MS = 5_000;
const IDLE_POLL_MS = 30_000;
const IDLE_AFTER_MS = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [latestArrival, setLatestArrival] = useState(null);

  // ─── Sound Preferences ───
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('notificationSoundEnabled', String(next));
      return next;
    });
  }, []);

  // ─── Polling & Fetching ───
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const seenIdsRef = useRef(new Set());
  const hasInitializedRef = useRef(false);

  // ─── FIXED: Moved useRef to the top level ───
  const lastActiveAtRef = useRef(Date.now());

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!mountedRef.current) return;

      if (!res.ok) {
        if (res.status === 401) {
          setNotifications([]);
          setUnreadCount(0);
          setError('');
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to load notifications');
        }
        return;
      }

      const data = await res.json();
      if (!mountedRef.current) return;

      const incoming = data.notifications || [];

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        incoming.forEach((n) => seenIdsRef.current.add(n.id));
      } else {
        const unseen = incoming.filter((n) => !seenIdsRef.current.has(n.id));
        if (unseen.length > 0) {
          unseen.forEach((n) => seenIdsRef.current.add(n.id));
          setLatestArrival(unseen[0]);
        }
      }

      setNotifications(incoming);
      setUnreadCount(data.unreadCount || 0);
      setError('');
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[NOTIFICATIONS_FETCH]', err);
      setError('Network error');
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, []);

  const acknowledgeArrival = useCallback(() => {
    setLatestArrival(null);
  }, []);

  // ─── Adaptive Polling Effect ───
  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const computeInterval = () => {
      const sinceActive = Date.now() - lastActiveAtRef.current;
      return sinceActive < IDLE_AFTER_MS ? ACTIVE_POLL_MS : IDLE_POLL_MS;
    };

    const stopTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = () => {
      stopTimer();
      if (document.hidden) return;
      const delay = computeInterval();
      timerRef.current = setTimeout(() => {
        if (!document.hidden) {
          refresh({ silent: true });
          scheduleNext();
        }
      }, delay);
    };

    const markActive = () => {
      const wasIdle = Date.now() - lastActiveAtRef.current >= IDLE_AFTER_MS;
      lastActiveAtRef.current = Date.now();
      if (wasIdle && !document.hidden) scheduleNext();
    };

    const handleVisibility = () => {
      if (document.hidden) stopTimer();
      else {
        refresh({ silent: true });
        scheduleNext();
      }
    };

    const handleFocus = () => {
      lastActiveAtRef.current = Date.now();
      refresh({ silent: true });
      scheduleNext();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    scheduleNext();

    return () => {
      mountedRef.current = false;
      stopTimer();
      activityEvents.forEach((evt) => window.removeEventListener(evt, markActive));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

  // ─── Mark Read ───
  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    } catch (err) {
      console.error('[NOTIF_MARK_READ]', err);
      refresh({ silent: true });
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const snapshot = notifications;
    const previousUnread = unreadCount;
    setNotifications((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch (err) {
      setNotifications(snapshot);
      setUnreadCount(previousUnread);
    }
  }, [notifications, unreadCount]);

  // ─── Return ───
  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    refresh,
    latestArrival,
    acknowledgeArrival,
    // Sound preferences
    soundEnabled,
    toggleSound,
    // Desktop prefs (stubs to prevent crashes in NotificationToggle)
    desktopEnabled: false,
    desktopPermission: 'default',
    toggleDesktop: async () => {},
  };
}