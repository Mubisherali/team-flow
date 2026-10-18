// -------------------------------------------------------------
// useHotkeys - Global keyboard shortcut listener
// -------------------------------------------------------------
//
// USAGE:
//   useHotkeys({
//     onOpenSearch: () => setOpen(true)
//   })
// -------------------------------------------------------------

'use client';

import { useEffect } from 'react';

export function useHotkeys({ onOpenSearch }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        
        // Ignore if the user is typing in an input or textarea
        const target = e.target;
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (!isTyping) {
          e.preventDefault(); // Stop the browser from focusing the URL bar
          onOpenSearch?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);
}