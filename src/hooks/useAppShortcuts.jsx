// -------------------------------------------------------------
// useAppShortcuts - Global keyboard shortcuts for navigation & actions
// -------------------------------------------------------------
//
// SUPPORTED SHORTCUTS:
//   G + W  → /workspaces
//   G + T  → /my-tasks
//   G + S  → /settings/profile
//   G + H  → /workspaces/[currentId]
//   C      → Trigger Create Task (via callback)
//   N      → Trigger Create Project (via callback)
// -------------------------------------------------------------

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useAppShortcuts({
  workspaceId,
  isInsideProject,
  onCreateTask,
  onCreateProject,
}) {
  const router = useRouter();
  
  // Use a ref to track if we just pressed 'G' (for the G + W sequence)
  const gPressedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Ignore if the user is typing in an input/textarea
      const target = e.target;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
        
      if (isTyping) return;

      // 2. Handle Escape (Close modals - handled elsewhere, but we ensure it resets state)
      if (e.key === 'Escape') {
        gPressedRef.current = false;
        return;
      }

      const key = e.key.toLowerCase();

      // 3. Handle Sequential Keys (G + X)
      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        switch (key) {
          case 'w':
            e.preventDefault();
            router.push('/workspaces');
            break;
          case 't':
            e.preventDefault();
            router.push('/my-tasks');
            break;
          case 's':
            e.preventDefault();
            router.push('/settings/profile');
            break;
          case 'h':
            if (workspaceId) {
              e.preventDefault();
              router.push(`/workspaces/${workspaceId}`);
            }
            break;
          default:
            break;
        }
        return;
      }

      // 4. Handle Single Key Triggers
      switch (key) {
        case 'g':
          // Don't trigger if they press Cmd+G or Ctrl+G
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          gPressedRef.current = true;
          
          // Reset the "G" state after 1 second if no second key is pressed
          timeoutRef.current = setTimeout(() => {
            gPressedRef.current = false;
          }, 1000);
          break;

        case 'c':
          if ((e.metaKey || e.ctrlKey) && key === 'c') return; // Ignore Copy
          if (isInsideProject && onCreateTask) {
            e.preventDefault();
            onCreateTask();
          }
          break;

        case 'n':
          if ((e.metaKey || e.ctrlKey) && key === 'n') return; // Ignore New Window
          if (workspaceId && !isInsideProject && onCreateProject) {
            e.preventDefault();
            onCreateProject();
          }
          break;

        case '?':
          // The '?' key is Shift + / on most keyboards
          // We will handle this via a custom event or a prop if needed,
          // but for now, let's trigger a custom event that the Shell listens to.
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-shortcuts'));
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router, workspaceId, isInsideProject, onCreateTask, onCreateProject]);
}