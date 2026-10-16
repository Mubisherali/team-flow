// -------------------------------------------------------------
// Auth Layout - Centered shell for /login and /register
// -------------------------------------------------------------
//
// WHEN USED:
//   Wraps the /login and /register pages via the (auth) route
//   group.
//
// STRUCTURE:
//   Full-screen container (bg-gray-50 / dark #0a0c10)
//     - Decorative rotated feature text layer (md+ only)
//     - Radial vignette (fades edges so card stays readable)
//     - Centered content wrapper (max-w-md)
//
// POLISH:
//   - `-rotate-30` → arbitrary value `-rotate-[30deg]`
//     (not a Tailwind default)
//   - Decorative opacity raised slightly for display safety
//   - Removed redundant min-h-screen + sm: breakpoint on inner
//   - Content wrapper gets defensive z-10
//   - Header comment format aligned
//
// PRESERVED:
//   - FEATURES array (unchanged)
//   - Decorative layer (aria-hidden + pointer-events-none)
//   - Radial vignette gradient values
//   - Responsive behavior (hidden below md)
// -------------------------------------------------------------

const FEATURES = [
  'MANAGE PROJECTS',
  'ASSIGN TASKS',
  'TRACK PROGRESS',
  'KANBAN BOARDS',
  'INVITE MEMBERS',
  'COLLABORATE',
  'COMMENTS',
  'NOTIFICATIONS',
];

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0c10]">
      {/* ─── Decorative background layer (md+ only) ─── */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          hidden md:flex items-center justify-center
        "
      >
        <div className="-rotate-[30deg] flex flex-col gap-12 select-none">
          {FEATURES.map((text, i) => (
            <p
              key={text}
              className={`
                whitespace-nowrap
                font-black
                tracking-tighter
                leading-none
                text-gray-900 dark:text-white
                opacity-[0.04] dark:opacity-[0.06]
                ${i % 2 === 0 ? 'text-[8rem]' : 'text-[6rem]'}
              `}
            >
              {text}
              <span className="mx-12 opacity-40">·</span>
              {FEATURES[(i + 3) % FEATURES.length]}
            </p>
          ))}
        </div>
      </div>

      {/* ─── Radial vignette ─── */}
      {/* Fades the decorative text toward the edges so the
          center stays readable for the card. */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(249,250,251,0.85)_80%)]
          dark:bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(10,12,16,0.85)_80%)]
        "
      />

      {/* ─── Content ─── */}
      <div
        className="
          relative z-10
          min-h-screen flex items-center justify-center
          p-4
        "
      >
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;