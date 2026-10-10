// -------------------------------------------------------------
// useSidebarStats - Fetch context stats for the sidebar modules
// -------------------------------------------------------------
//
// INPUT:
//   { workspaceId, projectId }
//
// OUTPUT:
//   stats object — passed to useSidebarModules as subtext data
//
// CACHING:
//   We keep stats in local state. When the context changes
//   (workspace or project switches), we refetch.
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';

export function useSidebarStats({ workspaceId, projectId }) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    let cancelled = false;

    // No workspace → no stats
    if (!workspaceId) {
      setStats({});
      return;
    }

    async function load() {
      try {
        const qs = new URLSearchParams({ workspaceId });
        if (projectId) qs.set('projectId', projectId);

        const res = await fetch(`/api/sidebar-stats?${qs.toString()}`, {
          cache: 'no-store',
        });

        if (cancelled) return;

        if (!res.ok) {
          setStats({});
          return;
        }

        const data = await res.json();
        setStats(data.stats || {});
      } catch {
        if (!cancelled) setStats({});
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId]);

  return stats;
}