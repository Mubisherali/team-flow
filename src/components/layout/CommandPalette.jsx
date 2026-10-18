// -------------------------------------------------------------
// CommandPalette - Cmd+K Global Search & Quick Actions
// -------------------------------------------------------------
//
// DEPENDENCIES:
//   npm install cmdk
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette({ 
  open, 
  setOpen, 
  workspaceId, 
  projectId 
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ tasks: [], projects: [], workspaces: [] });

  // ─── Fetch Data when query changes ───
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ tasks: [], projects: [], workspaces: [] });
      return;
    }

    if (query.length < 2) {
      setResults({ tasks: [], projects: [], workspaces: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, open]);

  // ─── Keyboard listener for Escape ───
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  // ─── Action Handlers ───
  const runAction = (action) => {
    setOpen(false);
    setTimeout(() => action(), 100); // Close menu first, then navigate
  };

  const handleNavigate = (path) => {
    runAction(() => router.push(path));
  };

  const hasResults = results.tasks.length > 0 || results.projects.length > 0 || results.workspaces.length > 0;
  const showRecent = query.length < 2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-[#0f1115] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.1] overflow-hidden"
          >
            <Command 
              className="flex flex-col w-full h-full" 
              shouldFilter={false} // We handle filtering on the server
              loop
            >
              {/* ─── Input Area ─── */}
              <div className="flex items-center px-4 border-b border-gray-100 dark:border-white/[0.06]">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search tasks, projects, or type a command..."
                  className="flex-1 px-3 py-4 bg-transparent text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />

                {loading && (
                  <span className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
                )}
                
                {!loading && (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 rounded-md">
                    ESC
                  </kbd>
                )}
              </div>

              {/* ─── Results Area ─── */}
              <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-smooth">
                <Command.Empty className="py-12 text-center text-[13px] text-gray-500">
                  No results found for &quot;{query}&quot;.
                </Command.Empty>

                {/* RECENT / QUICK ACTIONS (When input is empty) */}
                {showRecent && (
                  <Command.Group heading="Quick Actions" className="px-2 py-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <Command.Item
                      onSelect={() => handleNavigate('/my-tasks')}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                      </span>
                      Go to My Tasks
                    </Command.Item>

                    {/* Contextual Actions */}
                    {projectId && (
                      <Command.Item
                        onSelect={() => handleNavigate(`/workspaces/${workspaceId}/projects/${projectId}?new=true`)}
                        className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                      >
                        <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                        </span>
                        Create Task
                      </Command.Item>
                    )}

                    {workspaceId && (
                      <Command.Item
                        onSelect={() => handleNavigate(`/workspaces/${workspaceId}?new=true`)}
                        className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                      >
                        <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                        </span>
                        Create Project
                      </Command.Item>
                    )}
                    
                    <Command.Item
                      onSelect={() => handleNavigate('/workspaces?new=true')}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                      </span>
                      Create Workspace
                    </Command.Item>
                  </Command.Group>
                )}

                {/* SEARCH RESULTS (When input has text) */}
                {!showRecent && hasResults && (
                  <>
                    {/* Tasks */}
                    {results.tasks.length > 0 && (
                      <Command.Group heading="Tasks" className="px-2 py-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {results.tasks.map((task) => (
                          <Command.Item
                            key={task.id}
                            onSelect={() => handleNavigate(`/workspaces/${task.project.workspaceId}/projects/${task.projectId}/tasks/${task.id}`)}
                            className="flex items-center gap-3 px-3 py-2 mt-0.5 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                          >
                            <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /></svg>
                            </span>
                            <span className="flex-1 truncate">{task.title}</span>
                            <span className="text-[10px] text-gray-500">{task.project.name}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {/* Projects */}
                    {results.projects.length > 0 && (
                      <Command.Group heading="Projects" className="px-2 py-1 mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {results.projects.map((proj) => (
                          <Command.Item
                            key={proj.id}
                            onSelect={() => handleNavigate(`/workspaces/${proj.workspaceId}/projects/${proj.id}`)}
                            className="flex items-center gap-3 px-3 py-2 mt-0.5 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                          >
                            <span className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                            </span>
                            <span className="flex-1 truncate">{proj.name}</span>
                            <span className="text-[10px] text-gray-500">{proj.workspace.name}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {/* Workspaces */}
                    {results.workspaces.length > 0 && (
                      <Command.Group heading="Workspaces" className="px-2 py-1 mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {results.workspaces.map((ws) => (
                          <Command.Item
                            key={ws.id}
                            onSelect={() => handleNavigate(`/workspaces/${ws.id}`)}
                            className="flex items-center gap-3 px-3 py-2 mt-0.5 rounded-xl text-[13px] text-gray-900 dark:text-white cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-white/[0.06] transition-colors"
                          >
                            <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V20h14v-9.5" /></svg>
                            </span>
                            <span className="flex-1 truncate">{ws.name}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}