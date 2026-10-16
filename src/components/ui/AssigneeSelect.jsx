// -------------------------------------------------------------
// AssigneeSelect - Rich assignee picker with avatars
// -------------------------------------------------------------
//
// WHEN USED:
//   - TaskFields (compact modal editor)
//   - CreateTaskModal (task creation form)
//
// WHY NOT <Select>:
//   The generic <Select> handles dot/icon options, but the
//   assignee picker needs avatars, emails as subtitles, and
//   the "YOU" badge. Rather than bloat <Select> with one-off
//   props, we build a focused component that reuses the same
//   visual language.
//
// PROPS:
//   value         : string (userId) | '' for unassigned
//   members       : [{ userId, name, email, avatarUrl }]
//   currentUserId : string (to show "YOU" badge)
//   disabled      : boolean
//   onChange      : (userId) => void
//
// BEHAVIOR:
//   - Click trigger → open
//   - Click option → select + close
//   - Click outside → close
//   - Escape → close
//   - ArrowUp/Down/Enter → keyboard select
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AssigneeSelect = ({
  value,
  members = [],
  currentUserId,
  disabled = false,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // ─── Build options list: Unassigned + members ───
  const options = useMemo(
    () => [
      { userId: '', name: null, email: null, avatarUrl: null, isUnassigned: true },
      ...members,
    ],
    [members]
  );

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.userId === value),
    [options, value]
  );

  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  // ─── Open / close ───
  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, selectedIndex]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setHighlighted(-1);
  }, []);

  // ─── Click outside ───
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeMenu]);

  // ─── Keyboard ───
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setHighlighted(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlighted(options.length - 1);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const opt = options[highlighted];
        if (opt) {
          onChange?.(opt.userId);
          closeMenu();
          triggerRef.current?.focus();
        }
        break;
      }
      default:
        break;
    }
  };

  // ─── Scroll highlighted into view ───
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const node = menuRef.current.querySelector(
      `[data-option-index="${highlighted}"]`
    );
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [open, highlighted]);

  const handleSelect = (opt) => {
    onChange?.(opt.userId);
    closeMenu();
    triggerRef.current?.focus();
  };

  // ─── Trigger content ───
  const triggerContent = selected?.isUnassigned ? (
    <>
      <span
        aria-hidden="true"
        className="
          w-5 h-5 rounded-full flex-shrink-0
          border border-dashed border-gray-300 dark:border-gray-600
        "
      />
      <span className="flex-1 min-w-0 truncate text-gray-500 dark:text-gray-400">
        Unassigned
      </span>
    </>
  ) : (
    <>
      <UserAvatar
        name={selected.name}
        email={selected.email}
        image={selected.avatarUrl}
        size={5}
      />
      <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-white">
        {selected.name || selected.email}
      </span>
      {selected.userId === currentUserId && (
        <span
          className="
            flex-shrink-0
            text-[9.5px] font-bold uppercase tracking-wider
            px-1.5 py-0.5 rounded
            bg-indigo-500/10 dark:bg-indigo-500/15
            text-indigo-700 dark:text-indigo-300
          "
        >
          You
        </span>
      )}
    </>
  );

  return (
    <div ref={wrapRef} className="relative">
      {/* ══════════ TRIGGER ══════════ */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="
          w-full flex items-center gap-2 text-left
          px-3.5 py-2.5 rounded-xl text-[13px]
          border bg-white dark:bg-white/[0.03]
          text-gray-900 dark:text-white
          border-gray-200 dark:border-white/[0.08]
          hover:border-gray-300 dark:hover:border-white/[0.12]
          focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
          transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        <span className="flex-1 min-w-0 flex items-center gap-2">
          {triggerContent}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`
            text-gray-400 flex-shrink-0
            transition-transform duration-200
            ${open ? 'rotate-180' : ''}
          `}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ══════════ MENU ══════════ */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            role="listbox"
            className="
              absolute top-full left-0 right-0 mt-1 z-50
              max-h-64 overflow-y-auto
              rounded-xl
              bg-white dark:bg-[#111318]
              border border-gray-200 dark:border-white/[0.08]
              shadow-xl shadow-black/10 dark:shadow-black/40
              py-1

              [scrollbar-width:thin]
              [scrollbar-color:rgba(120,120,120,0.35)_transparent]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[rgba(120,120,120,0.35)]
            "
          >
            {options.map((opt, i) => {
              const isSelected = opt.userId === value;
              const isHighlighted = i === highlighted;
              const isMe = opt.userId === currentUserId;

              return (
                <button
                  key={opt.userId || '__unassigned'}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-option-index={i}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => handleSelect(opt)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 text-left
                    transition-colors duration-100
                    ${
                      isSelected
                        ? 'bg-indigo-500/[0.08] dark:bg-indigo-500/10'
                        : isHighlighted
                          ? 'bg-gray-100 dark:bg-white/[0.05]'
                          : ''
                    }
                  `}
                >
                  {opt.isUnassigned ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="
                          w-5 h-5 rounded-full flex-shrink-0
                          border border-dashed border-gray-300 dark:border-gray-600
                        "
                      />
                      <span className="text-[13px] text-gray-500 dark:text-gray-400">
                        Unassigned
                      </span>
                    </>
                  ) : (
                    <>
                      <UserAvatar
                        name={opt.name}
                        email={opt.email}
                        image={opt.avatarUrl}
                        size={5}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                            text-[13px] font-medium truncate
                            ${
                              isSelected
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-900 dark:text-white'
                            }
                          `}
                        >
                          {opt.name || opt.email}
                        </p>
                        {opt.name && opt.email && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">
                            {opt.email}
                          </p>
                        )}
                      </div>

                      {isMe && (
                        <span
                          className="
                            flex-shrink-0
                            text-[9.5px] font-bold uppercase tracking-wider
                            px-1.5 py-0.5 rounded
                            bg-indigo-500/10 dark:bg-indigo-500/15
                            text-indigo-700 dark:text-indigo-300
                          "
                        >
                          You
                        </span>
                      )}

                      {isSelected && !isMe && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          aria-hidden="true"
                          className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================
// UserAvatar - small avatar chip (image or initials)
// =============================================================
const sizeMap = {
  5: 'w-5 h-5',
  6: 'w-6 h-6',
  7: 'w-7 h-7',
  8: 'w-8 h-8',
  9: 'w-9 h-9',
};

const UserAvatar = ({ name, email, image, size = 5 }) => {
  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const dim = sizeMap[size] || sizeMap[5];

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || 'User'}
        title={name || email}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`
        ${dim} rounded-full flex-shrink-0
        bg-indigo-600 text-white
        flex items-center justify-center
        font-semibold text-[9px]
      `}
      title={name || email}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

export default AssigneeSelect;