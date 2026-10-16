// -------------------------------------------------------------
// useSidebarStats - Fetch context stats for the sidebar modules
// -------------------------------------------------------------
//
// INPUT:
//   { workspaceId, projectId }
//     - Both may be missing (e.g. on /invitations or /workspaces)
//
// OUTPUT:
//   stats object — passed to useSidebarModules as subtext data
//   Always includes pendingInvitationCount (defaults to 0).
//
// BEHAVIOR:
//   - Always fetches, even outside a workspace, so the
//     Invitations sidebar module can appear everywhere.
//   - Workspace-scoped stats only come back when workspaceId
//     is present; otherwise only pendingInvitationCount.
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';

export function useSidebarStats({ workspaceId, projectId }) {
  const [stats, setStats] = useState({ pendingInvitationCount: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const qs = new URLSearchParams();
        if (workspaceId) qs.set('workspaceId', workspaceId);
        if (workspaceId && projectId) qs.set('projectId', projectId);

        const url = qs.toString()
          ? `/api/sidebar-stats?${qs.toString()}`
          : '/api/sidebar-stats';

        const res = await fetch(url, { cache: 'no-store' });

        if (cancelled) return;

        if (!res.ok) {
          // Even on 4xx, the API returns a minimal stats object.
          const data = await res.json().catch(() => ({}));
          setStats({
            pendingInvitationCount: 0,
            ...(data.stats || {}),
          });
          return;
        }

        const data = await res.json();
        setStats({
          pendingInvitationCount: 0,
          ...(data.stats || {}),
        });
      } catch {
        if (!cancelled) setStats({ pendingInvitationCount: 0 });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId]);

  return stats;
}