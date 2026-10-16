// -------------------------------------------------------------
// Select - Custom glass dropdown (replaces native <select>)
// -------------------------------------------------------------
//
// WHY THIS EXISTS:
//   Native <select> in dark mode shows a white popup, ignores
//   our glass surfaces, and can't render rich options (dots,
//   icons, avatars). We need a custom dropdown that matches
//   the rest of the app.
//
// WHEN USED:
//   Anywhere you'd reach for <select>. Pass options as objects
//   and optionally override how the value/options render.
//
// PROPS:
//   value          : string | number | '' — current value
//   options        : [{ value, label, dot?, icon?, disabled? }]
//   onChange       : (value) => void
//   placeholder    : string  — shown when value is empty
//   disabled       : boolean
//   className      : string  — extra classes for the trigger
//   size           : 'sm' | 'md' (default 'md')
//   menuAlign      : 'left' | 'right' (default 'left')
//   renderValue    : optional (option) => JSX  — custom trigger content
//   renderOption   : optional (option) => JSX  — custom option content
//
// BEHAVIOR:
//   - Click trigger → open
//   - Click option → select + close
//   - Click outside → close
//   - Escape → close
//   - ArrowUp/Down → move highlight
//   - Enter → select highlighted
//   - Home/End → jump to first/last
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const triggerSizes = {
  sm: 'px-2.5 py-1.5 text-[12px] rounded-lg',
  md: 'px-3.5 py-2.5 text-[13px] rounded-xl',
};

const Select = ({
  value,
  options = [],
  onChange,
  placeholder = 'Select…',
  disabled = false,
  className = '',
  size = 'md',
  menuAlign = 'left',
  renderValue,
  renderOption,
}) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // ─── Selected option ───
  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  // Index of currently-selected option (for initial highlight)
  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );

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
        if (opt && !opt.disabled) {
          onChange?.(opt.value);
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
    if (node) {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlighted]);

  // ─── Select handler ───
  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    closeMenu();
    triggerRef.current?.focus();
  };

  // ─── Trigger content ───
  const triggerContent = (() => {
    if (selected) {
      return renderValue ? renderValue(selected) : renderDefaultValue(selected);
    }
    return (
      <span className="text-gray-500 dark:text-gray-500 truncate">
        {placeholder}
      </span>
    );
  })();

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
        className={`
          w-full flex items-center gap-2 text-left
          border bg-white dark:bg-white/[0.03]
          text-gray-900 dark:text-white
          border-gray-200 dark:border-white/[0.08]
          hover:border-gray-300 dark:hover:border-white/[0.12]
          focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
          transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          ${triggerSizes[size]}
          ${className}
        `}
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
            className={`
              absolute top-full mt-1 z-50
              min-w-full max-h-64 overflow-y-auto
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

              ${menuAlign === 'right' ? 'right-0' : 'left-0'}
            `}
          >
            {options.length === 0 ? (
              <p className="px-3 py-2 text-[12.5px] text-gray-500 dark:text-gray-500 italic">
                No options
              </p>
            ) : (
              options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isHighlighted = i === highlighted;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-option-index={i}
                    disabled={opt.disabled}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => handleSelect(opt)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px]
                      transition-colors duration-100
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${
                        isSelected
                          ? 'bg-indigo-500/[0.08] dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                          : isHighlighted
                            ? 'bg-gray-100 dark:bg-white/[0.05] text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    {renderOption ? (
                      renderOption(opt, { isSelected, isHighlighted })
                    ) : (
                      <>
                        {opt.dot && (
                          <span
                            aria-hidden="true"
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`}
                          />
                        )}
                        {opt.icon && (
                          <span
                            aria-hidden="true"
                            className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                          >
                            {opt.icon}
                          </span>
                        )}
                        <span className="flex-1 min-w-0 truncate">
                          {opt.label}
                        </span>
                        {isSelected && (
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
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================
// Default trigger content renderer
// =============================================================
function renderDefaultValue(opt) {
  return (
    <>
      {opt.dot && (
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`}
        />
      )}
      {opt.icon && (
        <span
          aria-hidden="true"
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        >
          {opt.icon}
        </span>
      )}
      <span className="flex-1 min-w-0 truncate">{opt.label}</span>
    </>
  );
}

export default Select;