// -------------------------------------------------------------
// Project Colors - Preset Palette
// -------------------------------------------------------------
//
// WHY PRESETS:
// Random user-picked colors can clash. A preset palette
// guarantees every project looks good next to the others.
//
// WHERE USED:
//   - validators/project.js   → server-side color validation
//   - CreateProjectModal      → color swatch picker
//   - ProjectCard             → accent stripe / avatar color
//   - Project detail page     → header accent
//
// The `value` is the hex string stored in the DB.
// The `name` is only used for accessibility / display.
// -------------------------------------------------------------

export const PROJECT_COLORS = [
  { name: 'Indigo',  value: '#6366f1' },
  { name: 'Blue',    value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Rose',    value: '#f43f5e' },
  { name: 'Violet',  value: '#8b5cf6' },
  { name: 'Cyan',    value: '#06b6d4' },
  { name: 'Orange',  value: '#f97316' },
];

// Convenience: just the hex values for validation.
export const PROJECT_COLOR_VALUES = PROJECT_COLORS.map((c) => c.value);

// Default color for new projects (first in the palette).
export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0].value;