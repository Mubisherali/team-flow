// -------------------------------------------------------------
// ShortcutsModal - Cheat sheet for keyboard shortcuts
// -------------------------------------------------------------
//
// TRIGGERED BY:
//   Pressing '?' anywhere in the app.
//
// PROPS:
//   isOpen    : boolean
//   onClose   : () => void
// -------------------------------------------------------------

'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function ShortcutsModal({ isOpen, onClose }) {
  // Close on Escape key
  // (The useAppShortcuts hook resets state, but we handle it here for UX)
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#0f1115] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.1] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Navigate and take action instantly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              <ShortcutGroup title="Navigation">
                <ShortcutRow label="Go to Workspaces" keys={['G', 'W']} />
                <ShortcutRow label="Go to My Tasks" keys={['G', 'T']} />
                <ShortcutRow label="Go to Settings" keys={['G', 'S']} />
                <ShortcutRow label="Go to Workspace Home" keys={['G', 'H']} />
              </ShortcutGroup>

              <ShortcutGroup title="Actions">
                <ShortcutRow label="Global Search" keys={['⌘', 'K']} />
                <ShortcutRow label="Create Task" keys={['C']} />
                <ShortcutRow label="Create Project" keys={['N']} />
                <ShortcutRow label="Show this menu" keys={['?']} />
              </ShortcutGroup>

            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 dark:bg-white/[0.02] px-6 py-3 text-[11px] text-center text-gray-500 border-t border-gray-100 dark:border-white/[0.06]">
              Press <Kbd>Esc</Kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================
// Sub-components
// =============================================================
function ShortcutGroup({ title, children }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function ShortcutRow({ label, keys }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center">
            <Kbd>{k}</Kbd>
            {i < keys.length - 1 && <span className="text-gray-400 mx-1 text-[10px]">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.1] rounded-md shadow-sm">
      {children}
    </kbd>
  );
}