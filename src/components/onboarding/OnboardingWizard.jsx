"use client";

// -------------------------------------------------------------
// OnboardingWizard - Animated split-screen onboarding
// TeamFlow · Workspace → Invitations → Project
// -------------------------------------------------------------

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import {
  PROJECT_COLORS,
  DEFAULT_PROJECT_COLOR,
} from "@/lib/project-colors";

const STEPS = [
  { number: "01", label: "Workspace" },
  { number: "02", label: "Your team" },
  { number: "03", label: "First project" },
];

const ease = [0.22, 1, 0.36, 1];

async function readResponse(res, fallbackMessage) {
  let data = {};

  try {
    data = await res.json();
  } catch {
    // The API may return an empty or non-JSON response.
  }

  if (!res.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export default function OnboardingWizard({ user }) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [invites, setInvites] = useState([""]);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(
    DEFAULT_PROJECT_COLOR
  );

  const [workspaceId, setWorkspaceId] = useState(null);

  const firstName = (user?.name || "there").trim().split(/\s+/)[0];

  // Alternate which side contains the form.
  // Step 1: Form left, story right.
  // Step 2: Story left, form right.
  // Step 3: Form left, story right.
  const formOnLeft = step !== 2;

  const selectedColor =
    PROJECT_COLORS.find((color) => color.value === projectColor) ||
    PROJECT_COLORS[0];

  // -----------------------------------------------------------
  // STEP 1 — CREATE WORKSPACE
  // -----------------------------------------------------------

  const handleNextStep1 = async (event) => {
    event.preventDefault();

    if (loading || !workspaceName.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_workspace",
          name: workspaceName.trim(),
          description: workspaceDesc.trim(),
        }),
      });

      const data = await readResponse(
        res,
        "Failed to create workspace."
      );

      if (!data?.workspace?.id) {
        throw new Error(
          "The workspace was created, but its ID was not returned. Please check your workspaces before trying again."
        );
      }

      setWorkspaceId(data.workspace.id);
      setStep(2);
    } catch (error) {
      toast.error(error.message || "Failed to create workspace.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // STEP 2 — INVITE TEAM
  // -----------------------------------------------------------

  const handleNextStep2 = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!workspaceId) {
      toast.error("Your workspace is missing. Please restart setup.");
      return;
    }

    const validInvites = [
      ...new Set(
        invites
          .map((email) => email.trim())
          .filter(Boolean)
          .map((email) => email.toLowerCase())
      ),
    ];

    setLoading(true);

    try {
      if (validInvites.length > 0) {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send_invites",
            workspaceId,
            emails: validInvites,
          }),
        });

        await readResponse(res, "Failed to send invitations.");
      }

      setStep(3);
    } catch (error) {
      toast.error(error.message || "Failed to send invitations.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // STEP 3 — CREATE PROJECT AND NAVIGATE
  // -----------------------------------------------------------

  const handleFinish = async (event) => {
    event.preventDefault();

    if (loading || !projectName.trim()) return;

    if (!workspaceId) {
      toast.error("Your workspace is missing. Please restart setup.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_project",
          workspaceId,
          name: projectName.trim(),
          color: projectColor,
        }),
      });

      const data = await readResponse(
        res,
        "Failed to create your project."
      );

      if (!data?.project?.id) {
        throw new Error(
          "The project response did not include an ID. Please check your workspace before trying again."
        );
      }

      const destination =
        `/workspaces/${workspaceId}/projects/${data.project.id}`;

      toast.success("Your project is ready!");

      // A full navigation avoids relying on the current onboarding
      // route to refresh correctly after the final API request.
      window.location.assign(destination);

      // Do not clear loading here. Navigation is now in progress.
    } catch (error) {
      console.error("[ONBOARDING_FINISH]", error);
      toast.error(error.message || "Failed to finish setup.");
      setLoading(false);
    }
  };

  const addInvite = () => {
    if (invites.length >= 5) {
      toast.error("You can add up to 5 email fields at once.");
      return;
    }

    setInvites((current) => [...current, ""]);
  };

  const updateInvite = (index, value) => {
    setInvites((current) =>
      current.map((email, i) => (i === index ? value : email))
    );
  };

  const removeInvite = (index) => {
    setInvites((current) => current.filter((_, i) => i !== index));
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#f4f4f5] selection:bg-indigo-400/30">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-indigo-600/[0.12] blur-[130px]" />
        <div className="absolute -bottom-48 right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-violet-600/[0.09] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.65) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.65) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 95%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        {/* Top navigation */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.045] shadow-lg shadow-black/20">
              <svg
                aria-hidden="true"
                width="19"
                height="19"
                viewBox="0 0 32 32"
                fill="none"
              >
                <path
                  d="M5 24V8h4.2l6.8 9 6.8-9H27v16h-4.5V15l-6.5 8-6.5-8v9H5Z"
                  fill="white"
                />
                <path
                  d="M24 4h4v4h-4z"
                  fill="#818cf8"
                />
              </svg>
            </div>

            <div>
              <p className="text-[13px] font-semibold tracking-[-0.03em] text-white">
                TeamFlow
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                Workspace setup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            <span className="text-[10px] font-medium text-zinc-400">
              Personal setup
            </span>
          </div>
        </header>

        {/* Main onboarding area */}
        <div className="my-auto py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-[1120px]">
            {/* Progress */}
            <div className="mb-8 sm:mb-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  LET&apos;S GET YOU STARTED
                </p>

                <p className="font-mono text-[10px] text-zinc-500">
                  STEP 0{step} <span className="text-zinc-700">/ 03</span>
                </p>
              </div>

              <div
                className="grid grid-cols-3 gap-2"
                aria-label={`Step ${step} of 3`}
              >
                {STEPS.map((item, index) => {
                  const active = step === index + 1;
                  const complete = step > index + 1;

                  return (
                    <div key={item.number}>
                      <div
                        className={`mb-2 h-[3px] overflow-hidden rounded-full ${
                          complete || active
                            ? "bg-indigo-400"
                            : "bg-white/[0.08]"
                        }`}
                      >
                        <motion.div
                          initial={false}
                          animate={{
                            scaleX: active || complete ? 1 : 0,
                          }}
                          transition={{ duration: 0.4, ease }}
                          className="h-full origin-left bg-gradient-to-r from-indigo-500 to-violet-400"
                        />
                      </div>

                      <p
                        className={`text-[9px] font-medium sm:text-[10px] ${
                          active
                            ? "text-white"
                            : complete
                              ? "text-indigo-300"
                              : "text-zinc-600"
                        }`}
                      >
                        <span className="mr-1.5 font-mono opacity-60">
                          {item.number}
                        </span>
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Animated split screen */}
            <div className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-7">
              {/* FORM PANEL */}
              <motion.section
                key={`form-position-${step}`}
                initial={{
                  opacity: 0,
                  x: formOnLeft ? -36 : 36,
                  y: 8,
                }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.48, ease }}
                className={`relative order-1 flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#101013]/95 shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-xl ${
                  formOnLeft ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
                />

                <div className="flex flex-1 flex-col p-6 sm:p-9 lg:p-10">
                  <AnimatePresence mode="wait" initial={false}>
                    {step === 1 && (
                      <motion.div
                        key="workspace-form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <StepEyebrow number="01" label="The foundation" />

                        <h1 className="mt-6 text-[27px] font-semibold leading-[1.15] tracking-[-0.055em] text-white sm:text-[32px]">
                          Welcome aboard,
                          <br />
                          <span className="text-indigo-300">
                            {firstName}.
                          </span>
                        </h1>

                        <p className="mt-3 max-w-sm text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                          Every great team needs a home. Let&apos;s create
                          a workspace for your projects, people, and ideas.
                        </p>

                        <form
                          onSubmit={handleNextStep1}
                          className="mt-8 flex flex-1 flex-col"
                        >
                          <div className="space-y-5">
                            <Field
                              label="Workspace name"
                              hint="Required"
                            >
                              <input
                                type="text"
                                autoFocus
                                autoComplete="organization"
                                required
                                maxLength={80}
                                value={workspaceName}
                                onChange={(event) =>
                                  setWorkspaceName(event.target.value)
                                }
                                placeholder="e.g. Acme Studio"
                                className="onboarding-input"
                              />
                            </Field>

                            <Field
                              label="What are you working on?"
                              hint="Optional"
                            >
                              <textarea
                                rows={3}
                                maxLength={240}
                                value={workspaceDesc}
                                onChange={(event) =>
                                  setWorkspaceDesc(event.target.value)
                                }
                                placeholder="A short description of your team or goals..."
                                className="onboarding-input min-h-[88px] resize-y"
                              />

                              <p className="mt-1.5 text-right text-[9px] text-zinc-700">
                                {workspaceDesc.length}/240
                              </p>
                            </Field>
                          </div>

                          <div className="mt-auto pt-7">
                            <PrimaryButton
                              loading={loading}
                              disabled={!workspaceName.trim()}
                              loadingText="Creating workspace..."
                            >
                              Create workspace
                              <ArrowRight />
                            </PrimaryButton>

                            <p className="mt-4 text-center text-[10px] text-zinc-600">
                              You can update these details later.
                            </p>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="invite-form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <StepEyebrow number="02" label="Better together" />

                        <h1 className="mt-6 text-[27px] font-semibold leading-[1.15] tracking-[-0.055em] text-white sm:text-[32px]">
                          Bring your
                          <br />
                          <span className="text-indigo-300">people in.</span>
                        </h1>

                        <p className="mt-3 max-w-sm text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                          Great work rarely happens alone. Invite your
                          teammates now, or keep going and do it later.
                        </p>

                        <form
                          onSubmit={handleNextStep2}
                          className="mt-8 flex flex-1 flex-col"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <label className="text-[11px] font-medium text-zinc-300">
                              Teammate email addresses
                            </label>

                            <span className="text-[9px] text-zinc-600">
                              Up to 5 fields
                            </span>
                          </div>

                          <div className="space-y-3">
                            {invites.map((email, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="group flex items-center gap-2"
                              >
                                <div className="relative min-w-0 flex-1">
                                  <svg
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                  >
                                    <rect
                                      x="3"
                                      y="5"
                                      width="18"
                                      height="14"
                                      rx="2"
                                    />
                                    <path d="m3 7 9 6 9-6" />
                                  </svg>

                                  <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) =>
                                      updateInvite(index, event.target.value)
                                    }
                                    placeholder="teammate@company.com"
                                    aria-label={`Teammate email ${index + 1}`}
                                    className="onboarding-input pl-10"
                                  />
                                </div>

                                {invites.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeInvite(index)}
                                    aria-label={`Remove email field ${index + 1}`}
                                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] text-zinc-600 transition-colors hover:border-red-400/20 hover:bg-red-400/[0.06] hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                                  >
                                    <svg
                                      aria-hidden="true"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.7"
                                    >
                                      <path
                                        d="M5 12h14"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </motion.div>
                            ))}
                          </div>

                          {invites.length < 5 && (
                            <button
                              type="button"
                              onClick={addInvite}
                              className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg py-1.5 text-[11px] font-medium text-indigo-300 transition-colors hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                            >
                              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-indigo-400/20 bg-indigo-400/[0.07]">
                                <svg
                                  aria-hidden="true"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </span>
                              Add another email
                            </button>
                          )}

                          <div className="mt-auto flex flex-col gap-3 pt-8">
                            <PrimaryButton
                              loading={loading}
                              loadingText="Sending invitations..."
                            >
                              Send invites
                              <ArrowRight />
                            </PrimaryButton>

                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => setStep(3)}
                              className="rounded-xl py-2.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:opacity-50"
                            >
                              I&apos;ll invite them later
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="project-form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <StepEyebrow number="03" label="Make it happen" />

                        <h1 className="mt-6 text-[27px] font-semibold leading-[1.15] tracking-[-0.055em] text-white sm:text-[32px]">
                          Turn ideas
                          <br />
                          into <span className="text-indigo-300">action.</span>
                        </h1>

                        <p className="mt-3 max-w-sm text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                          Create your first project. This is where your
                          team&apos;s tasks and progress start coming together.
                        </p>

                        <form
                          onSubmit={handleFinish}
                          className="mt-8 flex flex-1 flex-col"
                        >
                          <div className="space-y-6">
                            <Field label="Project name" hint="Required">
                              <input
                                type="text"
                                autoFocus
                                required
                                maxLength={100}
                                value={projectName}
                                onChange={(event) =>
                                  setProjectName(event.target.value)
                                }
                                placeholder="e.g. Website redesign"
                                className="onboarding-input"
                              />
                            </Field>

                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <label className="text-[11px] font-medium text-zinc-300">
                                  Choose a color
                                </label>

                                <span className="font-mono text-[9px] text-zinc-600">
                                  {projectColor}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                {PROJECT_COLORS.map((color) => {
                                  const selected =
                                    projectColor === color.value;

                                  return (
                                    <button
                                      key={color.value}
                                      type="button"
                                      onClick={() =>
                                        setProjectColor(color.value)
                                      }
                                      aria-label={`Choose project color ${color.value}`}
                                      aria-pressed={selected}
                                      title={color.value}
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101013] ${
                                        selected
                                          ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#101013]"
                                          : "border border-white/10 hover:scale-105 hover:border-white/30"
                                      }`}
                                      style={{
                                        backgroundColor: color.value,
                                      }}
                                    >
                                      {selected && (
                                        <svg
                                          aria-hidden="true"
                                          width="15"
                                          height="15"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke={
                                            color.value.toLowerCase() ===
                                            "#ffffff"
                                              ? "#111111"
                                              : "#ffffff"
                                          }
                                          strokeWidth="2.5"
                                        >
                                          <path
                                            d="m5 12 4 4L19 6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-8">
                            <PrimaryButton
                              loading={loading}
                              disabled={!projectName.trim()}
                              loadingText="Creating your project..."
                            >
                              Finish setup
                              <ArrowRight />
                            </PrimaryButton>

                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => setStep(2)}
                              className="mt-3 w-full rounded-xl py-2 text-[10px] font-medium text-zinc-600 transition-colors hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:opacity-50"
                            >
                              Back to invitations
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Form panel footer */}
                <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4 sm:px-9 lg:px-10">
                  <span className="text-[9px] text-zinc-600">
                    Your workspace, your way.
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.12em] text-zinc-700">
                    TF / 0{step}
                  </span>
                </div>
              </motion.section>

              {/* STORY / PREVIEW PANEL */}
              <motion.aside
                key={`story-position-${step}`}
                initial={{
                  opacity: 0,
                  x: formOnLeft ? 36 : -36,
                  y: 8,
                }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.48, ease, delay: 0.04 }}
                className={`relative order-2 flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#0d0d11]/80 p-6 sm:min-h-[390px] sm:p-9 lg:min-h-[580px] lg:p-10 ${
                  formOnLeft ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-transparent to-violet-500/[0.04]"
                />

                <div
                  aria-hidden="true"
                  className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.12] blur-[90px]"
                />

                <div className="relative flex flex-1 flex-col">
                  <AnimatePresence mode="wait" initial={false}>
                    {step === 1 && (
                      <motion.div
                        key="story-workspace"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                            YOUR NEXT CHAPTER
                          </span>

                          <span className="font-mono text-[10px] text-zinc-600">
                            01 — 03
                          </span>
                        </div>

                        <h2 className="mt-8 max-w-md text-[30px] font-semibold leading-[1.12] tracking-[-0.055em] text-white sm:text-[38px] lg:text-[42px]">
                          Big things
                          <br />
                          start with
                          <br />
                          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                            one workspace.
                          </span>
                        </h2>

                        <p className="mt-4 max-w-sm text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                          Bring your projects, people, and plans into one
                          focused place. Less scattered work. More meaningful
                          progress.
                        </p>

                        <WorkspacePreview
                          name={workspaceName}
                          description={workspaceDesc}
                        />

                        <div className="mt-auto flex items-center gap-3 pt-7">
                          <div className="flex -space-x-2">
                            {["M", "T", "A"].map((letter, index) => (
                              <div
                                key={letter}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111116] text-[9px] font-semibold text-white ${
                                  index === 0
                                    ? "bg-indigo-500"
                                    : index === 1
                                      ? "bg-violet-500"
                                      : "bg-sky-600"
                                }`}
                              >
                                {letter}
                              </div>
                            ))}
                          </div>

                          <p className="text-[10px] text-zinc-500">
                            Built for teams that want to move forward.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="story-team"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                            BETTER WORK, TOGETHER
                          </span>

                          <span className="font-mono text-[10px] text-zinc-600">
                            02 — 03
                          </span>
                        </div>

                        <h2 className="mt-8 max-w-md text-[30px] font-semibold leading-[1.12] tracking-[-0.055em] text-white sm:text-[38px] lg:text-[42px]">
                          Good work
                          <br />
                          is never
                          <br />
                          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                            a solo mission.
                          </span>
                        </h2>

                        <p className="mt-4 max-w-sm text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                          Bring your teammates into the loop. Share the work,
                          make responsibilities clear, and build momentum
                          together.
                        </p>

                        <TeamPreview invites={invites} />

                        <div className="mt-auto flex items-center gap-2 pt-7 text-[10px] text-zinc-500">
                          <svg
                            aria-hidden="true"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path
                              d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="m9 12 2 2 4-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Invite people when you&apos;re ready.
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="story-project"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                            FROM PLAN TO PROGRESS
                          </span>

                          <span className="font-mono text-[10px] text-zinc-600">
                            03 — 03
                          </span>
                        </div>

                        <h2 className="mt-8 max-w-md text-[30px] font-semibold leading-[1.12] tracking-[-0.055em] text-white sm:text-[38px] lg:text-[42px]">
                          Give your
                          <br />
                          next idea
                          <br />
                          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                            a place to grow.
                          </span>
                        </h2>

                        <p className="mt-4 max-w-sm text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                          One project. A clear direction. A team ready to
                          make it happen. Your TeamFlow workspace is almost
                          ready.
                        </p>

                        <ProjectPreview
                          name={projectName}
                          color={projectColor}
                          colorLabel={selectedColor?.name}
                        />

                        <div className="mt-auto flex items-center gap-3 pt-7">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                            <svg
                              aria-hidden="true"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="text-emerald-300"
                            >
                              <path
                                d="m5 12 4 4L19 6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>

                          <div>
                            <p className="text-[10px] font-medium text-zinc-300">
                              Almost there
                            </p>
                            <p className="mt-0.5 text-[9px] text-zinc-600">
                              Your dashboard is one step away.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.aside>
            </div>

            <p className="mt-6 text-center text-[9px] tracking-wide text-zinc-700">
              TEAMFLOW · LESS CHAOS, MORE FLOW.
            </p>
          </div>
        </div>
      </div>

      {/* Component-scoped input styling */}
      <style jsx global>{`
        .onboarding-input {
          display: block;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
          padding: 12px 14px;
          color: #f4f4f5;
          font-size: 12px;
          line-height: 1.6;
          outline: none;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .onboarding-input::placeholder {
          color: #52525b;
        }

        .onboarding-input:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .onboarding-input:focus {
          border-color: rgba(129, 140, 248, 0.65);
          background: rgba(99, 102, 241, 0.035);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.09);
        }

        .onboarding-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </main>
  );
}

// -------------------------------------------------------------
// Reusable UI components
// -------------------------------------------------------------

function StepEyebrow({ number, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] text-indigo-300">
        {number}
      </span>

      <span className="h-px w-6 bg-white/[0.12]" />

      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-[11px] font-medium text-zinc-300">
          {label}
        </label>

        {hint && (
          <span className="text-[9px] text-zinc-600">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  disabled,
  loadingText,
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="group inline-flex min-h-[47px] w-full items-center justify-center gap-2.5 rounded-xl border border-indigo-400/20 bg-indigo-500 px-4 py-3 text-[12px] font-semibold text-white shadow-[0_8px_28px_rgba(99,102,241,0.15)] transition-all duration-200 hover:border-indigo-300/40 hover:bg-indigo-400 hover:shadow-[0_8px_34px_rgba(99,102,241,0.25)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101013] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        d="M5 12h14m-7-7 7 7-7 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -------------------------------------------------------------
// Live workspace preview
// -------------------------------------------------------------

function WorkspacePreview({ name, description }) {
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111116] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15 text-[10px] font-bold text-indigo-300">
            {(name.trim() || "W").charAt(0).toUpperCase()}
          </div>

          <span className="text-[10px] font-medium text-zinc-300">
            {name.trim() || "Your workspace"}
          </span>
        </div>

        <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[8px] text-emerald-300">
          Workspace
        </span>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-600">
          YOUR SPACE
        </p>

        <p className="min-h-[32px] text-[11px] leading-5 text-zinc-400">
          {description.trim() ||
            "Your team's projects, tasks, and shared progress will live here."}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <PreviewTile
            label="Projects"
            value="Organized"
            icon="grid"
          />
          <PreviewTile
            label="Team"
            value="Connected"
            icon="users"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Live team preview
// -------------------------------------------------------------

function TeamPreview({ invites }) {
  const emails = invites
    .map((email) => email.trim())
    .filter(Boolean);

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111116] p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[10px] font-medium text-zinc-300">
          Your team
        </p>

        <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[9px] text-zinc-500">
          {emails.length.toString().padStart(2, "0")} INVITES
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-[11px] font-semibold text-indigo-200">
            Y
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-zinc-200">
              You
            </p>
            <p className="text-[9px] text-zinc-600">
              Workspace owner
            </p>
          </div>

          <span className="rounded-md bg-emerald-400/[0.07] px-2 py-1 text-[8px] text-emerald-300">
            Active
          </span>
        </div>

        {emails.length === 0 ? (
          <div className="flex items-center gap-3 border-t border-white/[0.06] pt-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/[0.13] text-zinc-600">
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>

            <div>
              <p className="text-[10px] text-zinc-400">
                Room for your teammates
              </p>
              <p className="mt-1 text-[9px] text-zinc-600">
                Add email addresses to invite them.
              </p>
            </div>
          </div>
        ) : (
          emails.slice(0, 3).map((email, index) => (
            <div
              key={`${email}-${index}`}
              className="flex min-w-0 items-center gap-3 border-t border-white/[0.06] pt-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-[10px] font-semibold text-violet-200">
                {email.charAt(0).toUpperCase()}
              </div>

              <p className="min-w-0 flex-1 truncate text-[10px] text-zinc-300">
                {email}
              </p>

              <span className="shrink-0 text-[9px] text-zinc-600">
                Invite
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Live project preview
// -------------------------------------------------------------

function ProjectPreview({ name, color }) {
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111116] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: color }}
          />

          <span className="text-[10px] font-medium text-zinc-300">
            {name.trim() || "Your first project"}
          </span>
        </div>

        <span className="text-[9px] text-zinc-600">
          Preview
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.13em] text-zinc-600">
              PROJECT BOARD
            </p>

            <p className="mt-1.5 text-[12px] font-semibold text-white">
              {name.trim() || "Untitled project"}
            </p>
          </div>

          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07]"
            style={{ backgroundColor: `${color}18` }}
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="1.7"
            >
              <path
                d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v5H4zM14 15h6v5h-6z"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "TO DO",
              count: "02",
              width: "w-3/4",
            },
            {
              label: "IN PROGRESS",
              count: "01",
              width: "w-1/2",
            },
            {
              label: "DONE",
              count: "01",
              width: "w-2/3",
            },
          ].map((column, index) => (
            <div
              key={column.label}
              className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.015] p-2"
            >
              <div className="mb-3 flex items-center justify-between gap-1">
                <span className="truncate text-[7px] font-semibold tracking-wide text-zinc-500">
                  {column.label}
                </span>

                <span className="text-[8px] text-zinc-600">
                  {column.count}
                </span>
              </div>

              {[0, 1].slice(0, index === 1 ? 1 : 2).map((item) => (
                <div
                  key={item}
                  className="mb-2 rounded-md border border-white/[0.06] bg-[#17171d] p-2"
                >
                  <div
                    className={`mb-2 h-1 rounded-full bg-white/[0.12] ${column.width}`}
                  />

                  <div className="h-1 w-1/2 rounded-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-[9px] text-zinc-600">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          Your next idea starts here.
        </div>
      </div>
    </div>
  );
}

function PreviewTile({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-indigo-300">
        {icon === "grid" ? (
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path
              d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <p className="text-[10px] font-medium text-zinc-200">
        {label}
      </p>

      <p className="mt-1 text-[9px] text-zinc-600">
        {value}
      </p>
    </div>
  );
}
