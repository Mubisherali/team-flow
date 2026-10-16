// -------------------------------------------------------------
// SidebarDrawer - Responsive wrapper around <Sidebar />
// -------------------------------------------------------------
//
// WHEN USED:
//   Wraps <Sidebar /> in the (dashboard) layout. On desktop it
//   renders the sidebar normally; on mobile it becomes a slide-
//   in drawer with a backdrop.
//
// STRUCTURE:
//   Desktop (≥1024px):
//     Renders children directly.
//   Mobile (<1024px):
//     Backdrop (fades with drawer state)
//     Drawer (slides in from left)
//
// POLISH:
//   - Backdrop has AnimatePresence-like transition already (via
//     Tailwind opacity) — kept as-is, it's smoother than
//     mount/unmount
//   - Drawer gets aria-label
//   - duration-250 → duration-200 (Tailwind default)
//   - Backdrop blur matched to modals
//
// PRESERVED:
//   - Props (isOpen, onClose, isMobile, children)
//   - Route-change auto-close
//   - Escape close
//   - Body scroll lock
//   - Same desktop passthrough behavior
// -------------------------------------------------------------

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SidebarDrawer = ({ isOpen, onClose, isMobile, children }) => {
  const pathname = usePathname() || '';
  const prevPathRef = useRef(pathname);

  // ─── Auto-close on route change (mobile only) ───
  useEffect(() => {
    if (!isMobile) return;
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      if (isOpen) onClose();
    }
  }, [pathname, isMobile, isOpen, onClose]);

  // ─── Escape closes (mobile only) ───
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMobile, isOpen, onClose]);

  // ─── Lock body scroll when drawer is open (mobile only) ───
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobile, isOpen]);

  // ─── Desktop: render children plainly ───
  if (!isMobile) {
    return children;
  }

  // ─── Mobile: fixed drawer + backdrop ───
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 z-40
          bg-black/50 dark:bg-black/70
          backdrop-blur-sm
          transition-opacity duration-200 ease-out
          ${
            isOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }
        `}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        aria-hidden={!isOpen}
        className={`
          fixed top-0 left-0 bottom-0 z-50
          w-[270px] max-w-[85vw]
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full overflow-hidden bg-white dark:bg-[#0b0d12] shadow-2xl">
          {children}
        </div>
      </div>
    </>
  );
};

export default SidebarDrawer;