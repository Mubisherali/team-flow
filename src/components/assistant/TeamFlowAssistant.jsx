
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "Show me overdue tasks",
  "Summarize our workspace",
  "Which tasks are assigned to me?",
  "Which projects have the most unfinished work?",
];

function SparkleIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
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
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22 2 11 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m22 2-7 20-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkdownMessage({ text }) {
  return (
    <div className="space-y-2 break-words text-[13px] leading-6 text-zinc-300">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="mt-3 text-base font-semibold text-white">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mt-3 text-sm font-semibold text-white">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-2 text-sm font-semibold text-white">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2 whitespace-pre-wrap">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-zinc-200">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-violet-400/60 pl-3 text-zinc-400">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 underline decoration-violet-300/40 underline-offset-4 hover:text-violet-200"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            return (
              <code
                className={
                  isBlock
                    ? "block overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-violet-200"
                    : "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-violet-200"
                }
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 max-w-full overflow-x-auto rounded-lg border border-white/10 bg-black/40">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-3 border-white/10" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function TeamFlowAssistant({ workspaceId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, open]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (messageText = input) => {
      const text = messageText.trim();

      if (!text || loading) return;

      if (!workspaceId) {
        setError("Workspace information is missing. Refresh the page and try again.");
        return;
      }

      const previousMessages = messages;

      setInput("");
      setError("");
      setLoading(true);

      setMessages((current) => [
        ...current,
        { role: "user", text },
        { role: "model", text: "" },
      ]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let answer = "";
      let buffer = "";
      let receivedDone = false;

      const updateAssistantMessage = (nextAnswer) => {
        setMessages((current) => {
          const next = [...current];
          const lastIndex = next.length - 1;

          if (next[lastIndex]?.role === "model") {
            next[lastIndex] = {
              ...next[lastIndex],
              text: nextAnswer,
            };
          }

          return next;
        });
      };

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            workspaceId,
            message: text,
            history: previousMessages
              .filter(
                (item) =>
                  ["user", "model"].includes(item.role) &&
                  typeof item.text === "string" &&
                  item.text.trim()
              )
              .slice(-6)
              .map(({ role, text: historyText }) => ({
                role,
                text: historyText,
              })),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMessage = "Unable to get a response. Please try again.";

          try {
            const data = await response.json();
            if (data?.error) errorMessage = data.error;
          } catch {
            // Keep the default error if the server returned no JSON.
          }

          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error("Streaming is not supported by this response.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const processEvent = (eventText) => {
          const dataLine = eventText
            .split(/\r?\n/)
            .find((line) => line.startsWith("data:"));

          if (!dataLine) return;

          const payload = dataLine.slice(5).trim();

          if (!payload) return;

          if (payload === "[DONE]") {
            receivedDone = true;
            return;
          }

          let data;

          try {
            data = JSON.parse(payload);
          } catch {
            return;
          }

          if (data.error) {
            throw new Error(data.error);
          }

          if (typeof data.text === "string" && data.text.length > 0) {
            answer += data.text;
            updateAssistantMessage(answer);
          }
        };

        while (true) {
          const { value, done } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || "";

          for (const eventText of events) {
            processEvent(eventText);
          }
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
          processEvent(buffer);
        }

        if (!answer.trim()) {
          throw new Error(
            "The assistant returned an empty response. Please try again."
          );
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("TeamFlow assistant error:", err);

        setError(
          err.message || "Something went wrong. Please try again."
        );

        // Remove the empty or incomplete assistant bubble on failure.
        setMessages((current) => {
          const next = [...current];
          const lastIndex = next.length - 1;

          if (next[lastIndex]?.role === "model") {
            if (!next[lastIndex].text) {
              next.pop();
            } else {
              next[lastIndex] = {
                ...next[lastIndex],
                text: `${next[lastIndex].text}\n\n*Response interrupted. Please try again.*`,
              };
            }
          }

          return next;
        });
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        setLoading(false);
      }
    },
    [input, loading, messages, workspaceId]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleNewChat = () => {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError("");
  };

  return (
    <>
      {/* Floating assistant launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open TeamFlow AI assistant"
          className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-600 text-white shadow-[0_8px_35px_rgba(124,58,237,0.35)] transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-black"
        >
          <SparkleIcon size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <section
          aria-label="TeamFlow AI assistant"
          className="fixed bottom-4 right-4 z-[100] flex h-[min(680px,calc(100dvh-32px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101014] text-white shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#15151b] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-violet-300">
                <SparkleIcon size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight">
                  TeamFlow AI
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Workspace assistant
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                disabled={loading || messages.length === 0}
                title="New conversation"
                aria-label="Start a new conversation"
                className="rounded-lg px-2.5 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                New chat
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin]">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-center py-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                  <SparkleIcon size={25} />
                </div>

                <h3 className="text-xl font-semibold tracking-tight">
                  What can I help with?
                </h3>

                <p className="mt-2 max-w-[290px] text-sm leading-6 text-zinc-400">
                  Ask about your workspace, projects, tasks, and team progress.
                </p>

                <div className="mt-6 space-y-2">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Suggested questions
                  </p>

                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={loading}
                      onClick={() => sendMessage(suggestion)}
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-3 text-left text-xs leading-5 text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-500/[0.07] hover:text-white disabled:opacity-50"
                    >
                      <span>{suggestion}</span>
                      <span className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`flex gap-2.5 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "model" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-300">
                        <SparkleIcon size={15} />
                      </div>
                    )}

                    <div
                      className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                        message.role === "user"
                          ? "rounded-br-md bg-violet-600 text-white"
                          : "rounded-tl-md border border-white/[0.07] bg-[#19191f]"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-6">
                          {message.text}
                        </p>
                      ) : message.text ? (
                        <MarkdownMessage text={message.text} />
                      ) : loading && index === messages.length - 1 ? (
                        <div className="flex items-center gap-2 py-1 text-xs text-zinc-400">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.2s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.1s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
                          </span>
                          Thinking…
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-3.5 py-3 text-xs leading-5 text-red-300"
              >
                <p>{error}</p>
                <p className="mt-1 text-red-300/70">
                  Check your connection and try again.
                </p>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-white/[0.08] bg-[#131318] p-3">
            <form onSubmit={handleSubmit}>
              <div className="flex items-end gap-2 rounded-xl border border-white/[0.1] bg-[#0c0c10] p-2 transition focus-within:border-violet-400/50">
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
                      if (!loading) sendMessage();
                    }
                  }}
                  placeholder="Ask about your workspace…"
                  aria-label="Message the AI assistant"
                  rows={1}
                  maxLength={2000}
                  disabled={loading}
                  className="max-h-28 min-h-9 flex-1 resize-y bg-transparent px-1.5 py-2 text-sm leading-5 text-white outline-none placeholder:text-zinc-600 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-600"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </form>

            <p className="mt-2 text-center text-[10px] text-zinc-600">
              AI can make mistakes. Verify important workspace details.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
