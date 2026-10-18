// -------------------------------------------------------------
// useNotifications - Adaptive polling hook
// -------------------------------------------------------------
//
// POLLING STRATEGY (adaptive):
//   - Active user (mouse/kbd/touch in last 30s) → poll every 5s
//   - Idle user                                 → poll every 30s
//   - Hidden tab                                → paused entirely
//   - Tab regains focus                         → instant fetch
//   - Tab becomes visible                       → instant fetch
//
// WHY ADAPTIVE:
//   Users only notice notification delay when they're actively
//   watching for one (after submitting for review, after asking
//   a teammate to reply, etc.). If they're idle, we can save
//   API calls. Feels instant when it matters, cheap when it
//   doesn't.
//
// NEW EXPORT:
//   latestArrival / acknowledgeArrival — unchanged from before.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Polling intervals ───
const ACTIVE_POLL_MS = 5_000;
const IDLE_POLL_MS = 30_000;
const IDLE_AFTER_MS = 30_000; // User is "active" for 30s after last input

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [latestArrival, setLatestArrival] = useState(null);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const seenIdsRef = useRef(new Set());
  const hasInitializedRef = useRef(false);

  // ─── Activity tracking ───
  const lastActiveAtRef = useRef(Date.now());
  const isActiveRef = useRef(true);
  const currentPollMsRef = useRef(ACTIVE_POLL_MS);

  // -----------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------
  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      // Skip if a fetch is already in-flight. Prevents hammering
      // the API when activity events + timer tick overlap.
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

        // ─── Detect newly arrived notifications ───
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          incoming.forEach((n) => seenIdsRef.current.add(n.id));
        } else {
          const unseen = incoming.filter(
            (n) => !seenIdsRef.current.has(n.id)
          );

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
    },
    []
  );

  // -----------------------------------------------------------
  // ACKNOWLEDGE
  // -----------------------------------------------------------
  const acknowledgeArrival = useCallback(() => {
    setLatestArrival(null);
  }, []);

  // -----------------------------------------------------------
  // POLLING — adaptive
  // -----------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    refresh();

    // ─── Compute current desired interval based on activity ───
    const computeInterval = () => {
      const sinceActive = Date.now() - lastActiveAtRef.current;
      return sinceActive < IDLE_AFTER_MS ? ACTIVE_POLL_MS : IDLE_POLL_MS;
    };

    // ─── Timer management ───
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
      currentPollMsRef.current = delay;

      timerRef.current = setTimeout(() => {
        if (!document.hidden) {
          refresh({ silent: true });
          scheduleNext();
        }
      }, delay);
    };

    // ─── Activity events ───
    // Throttled to avoid re-computing on every mousemove. Only
    // updates the ref — the actual interval change is picked up
    // on the next scheduled tick.
    const markActive = () => {
      const wasIdle =
        Date.now() - lastActiveAtRef.current >= IDLE_AFTER_MS;
      lastActiveAtRef.current = Date.now();

      // If we just went from idle → active, reschedule faster.
      if (wasIdle && !document.hidden) {
        isActiveRef.current = true;
        scheduleNext();
      }
    };

    // ─── Visibility ───
    const handleVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        // Coming back to the tab → refresh immediately, then
        // restart the timer at whatever pace is appropriate.
        refresh({ silent: true });
        scheduleNext();
      }
    };

    // ─── Window focus ───
    // Fires when the browser window regains focus (e.g. alt-tab).
    const handleFocus = () => {
      lastActiveAtRef.current = Date.now();
      refresh({ silent: true });
      scheduleNext();
    };

    // Attach listeners
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    activityEvents.forEach((evt) =>
      window.addEventListener(evt, markActive, { passive: true })
    );
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    scheduleNext();

    // ─── Cleanup ───
    return () => {
      mountedRef.current = false;
      stopTimer();
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, markActive)
      );
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

  // -----------------------------------------------------------
  // MARK ONE READ
  // -----------------------------------------------------------
  const markRead = useCallback(
    async (id) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
        });
        if (!res.ok) refresh({ silent: true });
      } catch (err) {
        console.error('[NOTIF_MARK_READ]', err);
        refresh({ silent: true });
      }
    },
    [refresh]
  );

  // -----------------------------------------------------------
  // MARK ALL READ
  // -----------------------------------------------------------
  const markAllRead = useCallback(async () => {
    const snapshot = notifications;
    const previousUnread = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => (n.isRead ? n : { ...n, isRead: true }))
    );
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (!res.ok) {
        setNotifications(snapshot);
        setUnreadCount(previousUnread);
      }
    } catch (err) {
      console.error('[NOTIF_MARK_ALL_READ]', err);
      setNotifications(snapshot);
      setUnreadCount(previousUnread);
    }
  }, [notifications, unreadCount]);

  // -----------------------------------------------------------
  // RETURN
  // -----------------------------------------------------------
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
  };
}