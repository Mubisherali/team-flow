
"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "Show me overdue tasks",
  "Summarize our workspace",
  "Which tasks are assigned to me?",
  "Which projects have the most unfinished work?",
];

function SparkleIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 14.3 9.7 21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m19 2 .8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8L19 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m18 6-12 12M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TeamFlowAssistant({ workspaceId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Start a clean conversation when switching workspaces.
  useEffect(() => {
    setMessages([]);
    setError("");
    setInput("");
  }, [workspaceId]);

  async function sendMessage(value = input) {
    const text = value.trim();

    if (!text || loading || requestRef.current) return;

    if (!workspaceId) {
      setError("Open a workspace to chat with TeamFlow AI.");
      return;
    }

    if (text.length > 2000) {
      setError("Please keep your message under 2000 characters.");
      return;
    }

    requestRef.current = true;
    setLoading(true);
    setError("");
    setInput("");

    const previousMessages = messages;
    const updatedMessages = [
      ...previousMessages,
      { role: "user", text },
    ];

    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          message: text,
          history: previousMessages.slice(-6),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get a response. Please try again."
        );
      }

      if (typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("The assistant returned an empty response.");
      }

      setMessages((current) => [
        ...current,
        { role: "model", text: data.answer.trim() },
      ]);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      requestRef.current = false;
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="TeamFlow AI assistant"
          aria-modal="false"
          className="mb-4 flex h-[min(620px,calc(100dvh-120px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101116] text-[#f5f5f5] shadow-[0_24px_100px_rgba(0,0,0,0.55)]"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/[0.08] bg-[#14151c] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-300">
                <SparkleIcon size={23} />
              </div>

              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  TeamFlow AI
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Workspace assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-2 text-white/50 transition hover:bg-white/[0.07] hover:text-white"
            >
              <CloseIcon />
            </button>
          </header>

          {/* Conversation */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="pt-3">
                <div className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-[11px] text-violet-200">
                  Your team, understood.
                </div>

                <h3 className="max-w-[270px] text-2xl font-semibold leading-tight tracking-tight">
                  What would you like to know?
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Ask about your projects, tasks, deadlines, or team progress.
                </p>

                <div className="mt-6 space-y-2">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                    Try asking
                  </p>

                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={!workspaceId || loading}
                      onClick={() => sendMessage(suggestion)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-3 text-left text-xs text-white/70 transition hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>{suggestion}</span>
                      <span className="text-white/30">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "model" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <SparkleIcon size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-[13px] leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-violet-500 text-white"
                      : "rounded-bl-md border border-white/[0.08] bg-white/[0.04] text-white/85"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-white/45">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <SparkleIcon size={15} />
                </div>
                Analyzing your workspace…
                <span className="animate-pulse">•••</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Errors */}
          {error && (
            <div
              role="alert"
              className="mx-4 mb-2 rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs leading-5 text-red-300"
            >
              {error}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-white/[0.08] bg-[#14151c] p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-[#0c0d12] p-2 transition focus-within:border-violet-400/40">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                placeholder={
                  workspaceId
                    ? "Ask about your workspace…"
                    : "Open a workspace first"
                }
                aria-label="Message TeamFlow AI"
                maxLength={2000}
                rows={1}
                disabled={!workspaceId || loading}
                className="max-h-28 min-h-[38px] flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/25 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                aria-label="Send message"
                disabled={!workspaceId || !input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <SendIcon />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-white/25">
              AI can make mistakes. Verify important information.
            </p>
          </form>
        </section>
      )}

      {/* Floating launcher */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close TeamFlow AI" : "Open TeamFlow AI"}
          aria-expanded={open}
          className="group flex h-14 items-center gap-3 rounded-full border border-violet-300/20 bg-[#17151f] px-4 text-white shadow-[0_8px_35px_rgba(99,70,220,0.25)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-[#211b30]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white transition group-hover:rotate-6">
            {open ? <CloseIcon /> : <SparkleIcon size={21} />}
          </span>

          <span className="pr-1 text-sm font-medium">
            TeamFlow AI
          </span>
        </button>
      </div>
    </div>
  );
}
