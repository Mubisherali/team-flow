// -------------------------------------------------------------
// useHotkeys - Global keyboard shortcut listener
// -------------------------------------------------------------
//
// USAGE:
//   useHotkeys({
//     onOpenSearch: () => setOpen(true)
//   })
//
// BEHAVIOR:
//   - Listens for Cmd+K (Mac) or Ctrl+K (Windows)
//   - Ignores the shortcut if the user is typing inside an
//     input, textarea, or contentEditable element.
// -------------------------------------------------------------

'use client';

import { useEffect } from 'react';

export function useHotkeys({ onOpenSearch }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // Stop browser default (like focusing URL bar)
        
        // Ignore if user is typing in an input or textarea
        const target = e.target;
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (!isTyping) {
          onOpenSearch?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);
}