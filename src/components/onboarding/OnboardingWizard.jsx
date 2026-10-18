// -------------------------------------------------------------
// OnboardingWizard - 3-step flow for brand new users
// -------------------------------------------------------------
//
// PROPS:
//   user : session user object (for the welcome message)
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from '@/lib/project-colors';

export default function OnboardingWizard({ user }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDesc, setWorkspaceDesc] = useState('');
  const [invites, setInvites] = useState(['']);
  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState(DEFAULT_PROJECT_COLOR);

  // Store IDs from previous steps
  const [workspaceId, setWorkspaceId] = useState(null);

  const firstName = (user?.name || 'there').split(' ')[0];

  // ─── Handlers ───
  const handleNextStep1 = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_workspace',
          name: workspaceName,
          description: workspaceDesc,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setWorkspaceId(data.workspace.id);
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep2 = async (e) => {
    e.preventDefault();
    const validInvites = invites.filter((email) => email.trim().length > 0);
    
    setLoading(true);
    try {
      if (validInvites.length > 0) {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_invites',
            workspaceId,
            emails: validInvites,
          }),
        });
        if (!res.ok) throw new Error('Failed to send invites');
      }
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_project',
          workspaceId,
          name: projectName,
          color: projectColor,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // Force a full refresh so the dashboard loads the new data
      router.refresh();
      router.push(`/workspaces/${workspaceId}/projects/${data.project.id}`);
      
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  // ─── Render ───
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0d12] p-4">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-300 dark:bg-white/[0.1]'
              }`}
            />
          ))}
        </div>

        <div className="bg-white dark:bg-[#0f1115] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Workspace */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome, {firstName}! 👋
                  </h1>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-8">
                    Let's start by creating your first workspace. This is where your team will collaborate.
                  </p>

                  <form onSubmit={handleNextStep1} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        autoFocus
                        required
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] text-[14px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={workspaceDesc}
                        onChange={(e) => setWorkspaceDesc(e.target.value)}
                        placeholder="What does your team do?"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] text-[14px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !workspaceName.trim()}
                      className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[14px] font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                    >
                      {loading ? 'Creating...' : 'Continue'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Invites */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Invite your team
                  </h1>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-8">
                    TeamFlow is better together. Send a few invites to get started.
                  </p>

                  <form onSubmit={handleNextStep2} className="space-y-4">
                    {invites.map((email, idx) => (
                      <div key={idx}>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            const newInvites = [...invites];
                            newInvites[idx] = e.target.value;
                            setInvites(newInvites);
                          }}
                          placeholder="teammate@company.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] text-[14px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setInvites([...invites, ''])}
                      className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                      Add another
                    </button>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-5 py-3.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 text-[14px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                      >
                        Skip
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[14px] font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                      >
                        {loading ? 'Sending...' : 'Send Invites & Continue'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: Project */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Create your first project
                  </h1>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-8">
                    Projects hold your tasks and Kanban boards. You can always add more later.
                  </p>

                  <form onSubmit={handleFinish} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Project Name
                      </label>
                      <input
                        type="text"
                        autoFocus
                        required
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Website Redesign"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] text-[14px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROJECT_COLORS.map((c) => {
                          const isSelected = projectColor === c.value;
                          return (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setProjectColor(c.value)}
                              className={`
                                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                                ${isSelected ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0f1115] ring-gray-900 dark:ring-white scale-110' : 'hover:scale-105'}
                              `}
                              style={{ backgroundColor: c.value }}
                            >
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !projectName.trim()}
                      className="w-full py-3.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[14px] font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                    >
                      {loading ? 'Building your workspace...' : 'Finish Setup'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}