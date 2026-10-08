// -------------------------------------------------------------
// useNotifications - Polling hook for notifications
// -------------------------------------------------------------
//
// POLLING:
//   Fetches /api/notifications every 30 seconds.
//   Pauses when the tab is hidden (document.hidden === true).
//   Resumes + refetches immediately when the tab becomes visible.
//
// WHY POLLING (not websockets):
//   Serverless (Vercel) doesn't hold long-lived connections
//   well. Polling is fine for notifications — 30s latency is
//   acceptable.
//
// OPTIMISTIC UPDATES:
//   markRead / markAllRead update local state immediately, so
//   the badge drops without waiting for the server. If the
//   request fails, we refresh to reconcile.
//
// USED BY:
//   - NotificationBell (in the sidebar)
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Refs to keep the polling timer and avoid stale closures
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // -----------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        cache: 'no-store',
      });
      if (!mountedRef.current) return;

      if (!res.ok) {
        // 401 is expected when logged out — treat as empty
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

      setNotifications(data.notifications || []);
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
  // POLLING with visibility handling
  // -----------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    refresh();

    // Set up interval
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

    // When the tab becomes visible, refresh immediately
    const handleVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
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
  // MARK ONE READ (optimistic)
  // -----------------------------------------------------------
  const markRead = useCallback(
    async (id) => {
      // Optimistic update — do this before the request
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
        });
        if (!res.ok) {
          // Reconcile on failure
          refresh({ silent: true });
        }
      } catch (err) {
        console.error('[NOTIF_MARK_READ]', err);
        refresh({ silent: true });
      }
    },
    [refresh]
  );

  // -----------------------------------------------------------
  // MARK ALL READ (optimistic)
  // -----------------------------------------------------------
  const markAllRead = useCallback(async () => {
    // Snapshot for rollback
    const snapshot = notifications;
    const previousUnread = unreadCount;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.isRead ? n : { ...n, isRead: true }))
    );
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (!res.ok) {
        // Revert
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
  };
}