// -------------------------------------------------------------
// NotificationsContext
// -------------------------------------------------------------
//
// WHY THIS EXISTS:
//   Both <NotificationBell /> and <NotificationToaster /> need
//   the same notifications data. If each ran useNotifications()
//   independently, we'd have TWO polling loops — wasteful and
//   inconsistent counts.
//
//   So: this provider runs the hook ONCE, and both consumers
//   read from context.
//
// USAGE:
//   <NotificationsProvider>
//     <NotificationBell />
//     <NotificationToaster />
//   </NotificationsProvider>
//
// CONSUMERS USE:
//   const { notifications, unreadCount, ... } = useNotificationsCtx();
// -------------------------------------------------------------

'use client';

import { createContext, useContext } from 'react';

import { useNotifications } from '@/hooks/useNotifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const value = useNotifications();

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsCtx() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      'useNotificationsCtx must be used inside <NotificationsProvider>'
    );
  }
  return ctx;
}