// -------------------------------------------------------------
// useNotifications - Polling hook for notifications
// -------------------------------------------------------------
//
// (Same as before, plus: tracking of newly-arrived notifications
// so the toaster can fire toasts.)
//
// NEW EXPORT:
//   latestArrival — the notification object that most recently
//     arrived via polling (NOT from the initial fetch). Reset to
//     null after the toaster consumes it via acknowledgeArrival().
//   acknowledgeArrival — call after showing a toast so we don't
//     fire it again.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Latest NEW arrival (only set after the first successful fetch).
  const [latestArrival, setLatestArrival] = useState(null);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // Track ids we've already seen. Used to detect what's new in
  // each poll.
  const seenIdsRef = useRef(new Set());
  const hasInitializedRef = useRef(false);

  // -----------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------
  const refresh = useCallback(async ({ silent = false } = {}) => {
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
      // First fetch: seed the seen set, don't toast anything.
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        incoming.forEach((n) => seenIdsRef.current.add(n.id));
      } else {
        // Find the newest id that we haven't seen yet.
        // incoming is newest-first, so the first unmatched is the arrival.
        const unseen = incoming.filter((n) => !seenIdsRef.current.has(n.id));

        if (unseen.length > 0) {
          // Mark all as seen
          unseen.forEach((n) => seenIdsRef.current.add(n.id));
          // Report the newest one (first in the array)
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
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------
  // ACKNOWLEDGE — call after firing a toast
  // -----------------------------------------------------------
  const acknowledgeArrival = useCallback(() => {
    setLatestArrival(null);
  }, []);

  // -----------------------------------------------------------
  // POLLING
  // -----------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (!document.hidden) refresh({ silent: true });
      }, POLL_INTERVAL_MS);
    };

    const stopTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) stopTimer();
      else {
        refresh({ silent: true });
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibility);
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
    // NEW:
    latestArrival,
    acknowledgeArrival,
  };
}