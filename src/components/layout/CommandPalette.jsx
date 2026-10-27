// -------------------------------------------------------------
// CommandPalette - Global Search & Quick Actions
// -------------------------------------------------------------
// Dependencies:
//   npm install cmdk framer-motion
// -------------------------------------------------------------

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_RESULTS = {
  tasks: [],
  projects: [],
  workspaces: [],
};

function Icon({ name, size = 18, className = "" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    check: (
      <>
        <path d="m9 12 2 2 4-4" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    ),
    workspace: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    sparkle: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.search}</svg>;
}

function ActionIcon({ icon, tone = "neutral" }) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-300 ring-rose-400/15",
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15",
    violet: "bg-violet-500/10 text-violet-300 ring-violet-400/15",
    blue: "bg-sky-500/10 text-sky-300 ring-sky-400/15",
    neutral: "bg-white/[0.045] text-zinc-300 ring-white/[0.07]",
  };

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone] || tones.neutral}`}
    >
      <Icon name={icon} size={17} />
    </span>
  );
}

function Shortcut({ children }) {
  return (
    <kbd className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md border border-white/[0.09] bg-white/[0.045] px-1.5 font-mono text-[10px] text-zinc-400">
      {children}
    </kbd>
  );
}

function ResultItem({ children, onSelect, value, icon, tone = "neutral", detail }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none transition-colors aria-selected:bg-white/[0.07] aria-selected:text-white"
    >
      <ActionIcon icon={icon} tone={tone} />

      <span className="min-w-0 flex-1 truncate font-medium">{children}</span>

      {detail && (
        <span className="hidden max-w-[38%] truncate text-xs text-zinc-500 sm:block">
          {detail}
        </span>
      )}

      <Icon
        name="arrow"
        size={14}
        className="shrink-0 text-zinc-600 opacity-0 transition-all group-aria-selected:translate-x-0.5 group-aria-selected:opacity-100"
      />
    </Command.Item>
  );
}

function SectionHeading({ children, count }) {
  return (
    <div className="flex items-center justify-between px-3 pb-2 pt-3 first:pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {children}
      </span>
      {typeof count === "number" && (
        <span className="text-[10px] tabular-nums text-zinc-600">
          {count}
        </span>
      )}
    </div>
  );
}

export default function CommandPalette({
  open,
  setOpen,
  workspaceId,
  projectId,
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const requestIdRef = useRef(0);
  const inputRef = useRef(null);

  const closePalette = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const resetSearch = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setResults(EMPTY_RESULTS);
    setError("");
    setLoading(false);
  }, []);

  // Global keyboard shortcuts.
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen, closePalette]);

  // Reset when the palette closes.
  useEffect(() => {
    if (!open) {
      resetSearch();
    }
  }, [open, resetSearch]);

  // Focus the search field when opened.
  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Debounced search with stale-response protection.
  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!open || normalizedQuery.length < 2) {
      requestIdRef.current += 1;
      setResults(EMPTY_RESULTS);
      setError("");
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) {
          throw new Error("Search request failed.");
        }

        const data = await response.json();

        if (requestId !== requestIdRef.current) return;

        setResults({
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;

        console.error("Command palette search failed:", err);
        setResults(EMPTY_RESULTS);
        setError("Search couldn't be completed. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const handleNavigate = useCallback(
    (path) => {
      closePalette();

      // Allow the exit animation to begin before navigation.
      window.setTimeout(() => router.push(path), 100);
    },
    [closePalette, router],
  );

  const normalizedQuery = query.trim();
  const showQuickActions = normalizedQuery.length < 2;
  const hasResults =
    results.tasks.length > 0 ||
    results.projects.length > 0 ||
    results.workspaces.length > 0;

  const totalResults =
    results.tasks.length +
    results.projects.length +
    results.workspaces.length;

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (!open) resetSearch();
      }}
    >
      {open && (
        <motion.div
          key="command-palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/65 px-3 pb-8 pt-[10vh] backdrop-blur-md sm:px-6 sm:pt-[14vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePalette();
          }}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.11] bg-[#0d0e12] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search TeamFlow"
          >
            {/* Decorative top glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/[0.09] to-transparent"
            />

            <Command
              className="relative flex max-h-[min(76vh,680px)] flex-col"
              shouldFilter={false}
              loop
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-zinc-400">
                  <Icon name="search" size={18} />
                </span>

                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search anything in TeamFlow..."
                  aria-label="Search tasks, projects, and workspaces"
                  className="h-[62px] min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 sm:text-[15px]"
                />

                {loading && (
                  <span
                    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/10 border-t-violet-400"
                    aria-label="Searching"
                    role="status"
                  />
                )}

                {!loading && query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                    aria-label="Clear search"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={closePalette}
                  className="hidden items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 text-[10px] text-zinc-500 transition-colors hover:text-white sm:flex"
                  aria-label="Close search"
                >
                  ESC
                </button>
              </div>

              {/* Content */}
              <Command.List className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
                {/* Quick actions */}
                {showQuickActions && (
                  <>
                    <div className="flex items-center gap-2 px-3 pb-2 pt-2">
                      <Icon
                        name="sparkle"
                        size={14}
                        className="text-violet-300"
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Quick actions
                      </span>
                    </div>

                    <Command.Group>
                      <ResultItem
                        value="Go to My Tasks"
                        icon="check"
                        tone="rose"
                        onSelect={() => handleNavigate("/my-tasks")}
                      >
                        Go to My Tasks
                      </ResultItem>

                      {projectId && workspaceId && (
                        <ResultItem
                          value="Create Task"
                          icon="plus"
                          tone="emerald"
                          onSelect={() =>
                            handleNavigate(
                              `/workspaces/${workspaceId}/projects/${projectId}?new=true`,
                            )
                          }
                        >
                          Create Task
                        </ResultItem>
                      )}

                      {workspaceId && (
                        <ResultItem
                          value="Create Project"
                          icon="folder"
                          tone="violet"
                          onSelect={() =>
                            handleNavigate(
                              `/workspaces/${workspaceId}?new=true`,
                            )
                          }
                        >
                          Create Project
                        </ResultItem>
                      )}

                      <ResultItem
                        value="Create Workspace"
                        icon="workspace"
                        tone="blue"
                        onSelect={() =>
                          handleNavigate("/workspaces?new=true")
                        }
                      >
                        Create Workspace
                      </ResultItem>
                    </Command.Group>

                    <div className="mx-3 my-3 border-t border-white/[0.06]" />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 text-[11px] text-zinc-600">
                      <span>Navigate your workspace faster</span>
                      <span className="flex items-center gap-1.5">
                        <Shortcut>↑</Shortcut>
                        <Shortcut>↓</Shortcut>
                        <span>to navigate</span>
                        <Shortcut>↵</Shortcut>
                        <span>to open</span>
                      </span>
                    </div>
                  </>
                )}

                {/* Minimum query hint */}
                {!showQuickActions && normalizedQuery.length < 2 && (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-zinc-500">
                      <Icon name="search" size={20} />
                    </div>
                    <p className="text-sm text-zinc-300">
                      Keep typing to search
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Enter at least 2 characters.
                    </p>
                  </div>
                )}

                {/* Loading state */}
                {!showQuickActions && loading && !hasResults && !error && (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
                    <p className="text-sm text-zinc-400">Searching TeamFlow...</p>
                  </div>
                )}

                {/* Error state */}
                {!showQuickActions && !loading && error && (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-rose-300">{error}</p>
                    <button
                      type="button"
                      onClick={() => setQuery((current) => `${current} `)}
                      className="mt-3 rounded-lg border border-white/[0.09] px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.05]"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!showQuickActions &&
                  !loading &&
                  !error &&
                  !hasResults && (
                    <Command.Empty forceMount>
                      <div className="px-4 py-12 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-zinc-500">
                          <Icon name="search" size={20} />
                        </div>
                        <p className="text-sm font-medium text-zinc-300">
                          No results found
                        </p>
                        <p className="mt-1 break-words text-xs text-zinc-600">
                          Nothing matched &quot;{normalizedQuery}&quot;.
                        </p>
                      </div>
                    </Command.Empty>
                  )}

                {/* Search results */}
                {!showQuickActions && hasResults && (
                  <>
                    <div className="flex items-center justify-between px-3 pb-1 pt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Search results
                      </span>
                      <span className="text-[10px] tabular-nums text-zinc-600">
                        {totalResults} found
                      </span>
                    </div>

                    {results.tasks.length > 0 && (
                      <Command.Group>
                        <SectionHeading count={results.tasks.length}>
                          Tasks
                        </SectionHeading>

                        {results.tasks.map((task) => (
                          <ResultItem
                            key={`task-${task.id}`}
                            value={`task ${task.title} ${task.project?.name || ""}`}
                            icon="check"
                            tone="rose"
                            detail={task.project?.name}
                            onSelect={() => {
                              if (
                                !task.project?.workspaceId ||
                                !task.projectId ||
                                !task.id
                              ) {
                                return;
                              }

                              handleNavigate(
                                `/workspaces/${task.project.workspaceId}/projects/${task.projectId}/tasks/${task.id}`,
                              );
                            }}
                          >
                            {task.title}
                          </ResultItem>
                        ))}
                      </Command.Group>
                    )}

                    {results.projects.length > 0 && (
                      <Command.Group>
                        <SectionHeading count={results.projects.length}>
                          Projects
                        </SectionHeading>

                        {results.projects.map((project) => (
                          <ResultItem
                            key={`project-${project.id}`}
                            value={`project ${project.name} ${project.workspace?.name || ""}`}
                            icon="folder"
                            tone="violet"
                            detail={project.workspace?.name}
                            onSelect={() => {
                              if (!project.workspaceId || !project.id) return;

                              handleNavigate(
                                `/workspaces/${project.workspaceId}/projects/${project.id}`,
                              );
                            }}
                          >
                            {project.name}
                          </ResultItem>
                        ))}
                      </Command.Group>
                    )}

                    {results.workspaces.length > 0 && (
                      <Command.Group>
                        <SectionHeading count={results.workspaces.length}>
                          Workspaces
                        </SectionHeading>

                        {results.workspaces.map((workspace) => (
                          <ResultItem
                            key={`workspace-${workspace.id}`}
                            value={`workspace ${workspace.name}`}
                            icon="workspace"
                            tone="blue"
                            onSelect={() => {
                              if (!workspace.id) return;
                              handleNavigate(`/workspaces/${workspace.id}`);
                            }}
                          >
                            {workspace.name}
                          </ResultItem>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-black/20 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/15 text-[10px] font-bold text-violet-300">
                    TF
                  </span>
                  <span className="text-[10px] font-medium tracking-wide text-zinc-500">
                    TEAMFLOW COMMAND
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Shortcut>↵</Shortcut>
                    Select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shortcut>ESC</Shortcut>
                    Close
                  </span>
                </div>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
