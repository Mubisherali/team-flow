// -------------------------------------------------------------
// SidebarDrawer - Responsive wrapper around <Sidebar />
// -------------------------------------------------------------
//
// DESKTOP (>= 1024px):
//   Renders children (Sidebar) normally. Not a drawer.
//
// MOBILE (< 1024px):
//   Fixed-position drawer that slides in from the left.
//   Backdrop closes on tap. Escape closes. Route change closes.
//
// PROPS:
//   isOpen   : boolean  — mobile only; ignored on desktop
//   onClose  : () => void
//   isMobile : boolean  — from useIsMobile()
//   children : the sidebar
//
// WHY A WRAPPER (not baked into Sidebar):
//   Sidebar shouldn't know it's in a drawer. It just renders.
//   The drawer wraps it with mobile-specific behavior. Clean
//   separation of concerns.
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
        className={`
          fixed inset-0 z-40
          bg-black/50 backdrop-blur-sm
          transition-opacity duration-200 ease-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 bottom-0 z-50
          w-[270px] max-w-[85vw]
          transform transition-transform duration-250 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="h-full overflow-hidden bg-white dark:bg-[#0b0d12] shadow-2xl">
          {children}
        </div>
      </div>
    </>
  );
};

export default SidebarDrawer;