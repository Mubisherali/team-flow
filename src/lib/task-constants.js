// -------------------------------------------------------------
// Task Constants - Display Metadata
// -------------------------------------------------------------
//
// Maps task enums (TODO, HIGH, etc.) to the metadata the UI
// needs: labels, colors, sort order.
//
// COLORS:
//   Stored as Tailwind class strings, not hex. This lets us
//   use them directly in className={}. Each status/priority
//   has light + dark variants baked in.
// -------------------------------------------------------------

// -------------------------------------------------------------
// STATUSES
// -------------------------------------------------------------
// Order matters — the Kanban board renders columns left-to-right
// in this order.
export const TASK_STATUSES = [
  {
    value: 'TODO',
    label: 'To do',
    // Header accent for the column
    headerBg: 'bg-gray-100 dark:bg-gray-800',
    headerText: 'text-gray-700 dark:text-gray-300',
    // Small dot next to the label
    dot: 'bg-gray-400',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In progress',
    headerBg: 'bg-blue-50 dark:bg-blue-950',
    headerText: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  {
    value: 'REVIEW',
    label: 'Review',
    headerBg: 'bg-amber-50 dark:bg-amber-950',
    headerText: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  {
    value: 'DONE',
    label: 'Done',
    headerBg: 'bg-green-50 dark:bg-green-950',
    headerText: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
];

// Fast lookup by value: statusMeta('TODO') → { label, ... }
export function statusMeta(value) {
  return TASK_STATUSES.find((s) => s.value === value) || TASK_STATUSES[0];
}

// -------------------------------------------------------------
// PRIORITIES
// -------------------------------------------------------------
// Order: least urgent → most urgent. The UI shows them in
// this order in any picker.
export const TASK_PRIORITIES = [
  {
    value: 'LOW',
    label: 'Low',
    // Small dot on the task card
    dot: 'bg-gray-400',
    // Chip styling for pickers / filters
    badge:
      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    dot: 'bg-blue-500',
    badge:
      'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
  },
  {
    value: 'HIGH',
    label: 'High',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    dot: 'bg-red-500',
    badge:
      'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  },
];

export function priorityMeta(value) {
  return (
    TASK_PRIORITIES.find((p) => p.value === value) || TASK_PRIORITIES[1]
  );
}

// -------------------------------------------------------------
// DUE DATE HELPERS
// -------------------------------------------------------------
// Returns a small { label, className } object describing a due
// date relative to now.
//
//   null                          → null (don't render)
//   Overdue                       → "Overdue" (red)
//   Due today                     → "Today" (amber)
//   Due tomorrow                  → "Tomorrow" (amber)
//   Due within 7 days             → "In N days" (gray)
//   Further out                   → formatted date (gray)
export function dueDateMeta(dueDate) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();

  // Strip time — compare by calendar day.
  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dueDay = startOfDay(due);
  const today = startOfDay(now);

  const diffMs = dueDay - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label:
        diffDays === -1 ? 'Yesterday' : `${Math.abs(diffDays)}d overdue`,
      className: 'text-red-600 dark:text-red-400',
    };
  }

  if (diffDays === 0) {
    return { label: 'Today', className: 'text-amber-600 dark:text-amber-400' };
  }

  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      className: 'text-amber-600 dark:text-amber-400',
    };
  }

  if (diffDays <= 7) {
    return {
      label: `In ${diffDays} days`,
      className: 'text-gray-500 dark:text-gray-400',
    };
  }

  // Further out — show a short date like "Oct 12".
  const formatted = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return {
    label: formatted,
    className: 'text-gray-500 dark:text-gray-400',
  };
}

// -------------------------------------------------------------
// DATETIME-INPUT HELPER
// -------------------------------------------------------------
// <input type="datetime-local"> works with strings like
// "2026-10-12T14:30". DB stores full ISO with timezone.
// These convert both ways.
export function toDateTimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  // Adjust for local timezone so the input shows the right time.
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  const local = new Date(d.getTime() - offsetMs);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

export function fromDateTimeLocal(localString) {
  if (!localString) return null;
  return new Date(localString).toISOString();
}