// -------------------------------------------------------------
// Auth Layout - Centered shell for /login and /register
// -------------------------------------------------------------
//
// LAYOUT:
//   Full-screen background with decorative rotated text
//   (dramatic -30° diagonal).
//   The auth card sits centered on top.
//
// DECORATION:
//   Large, bold feature text, rotated -30°, with very low
//   opacity. Hidden on small screens (too cramped).
//
// ACCESSIBILITY:
//   The decorative layer is `aria-hidden` and pointer-events-none,
//   so it doesn't interfere with screen readers or clicks.
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
      {/* ─── Decorative background layer ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center"
      >
        <div className="-rotate-30 flex flex-col gap-10 select-none">
          {FEATURES.map((text, i) => (
            <p
              key={text}
              className={`
                whitespace-nowrap
                font-black
                tracking-tighter
                text-gray-900 dark:text-white
                opacity-[0.035] dark:opacity-[0.05]
                leading-none
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

      {/* ─── Subtle radial vignette on top of the text ─── */}
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
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;