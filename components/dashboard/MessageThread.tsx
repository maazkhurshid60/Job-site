"use client";

import { useEffect, useRef, useState } from "react";
import {
  listSubmissionMessages, sendSubmissionMessage,
  listAdminSubmissionMessages, sendAdminSubmissionMessage,
  type SubmissionMessage,
} from "@/lib/submissions";
import { timeAgo } from "@/lib/dates";
import { Loader } from "@/components/Loader";

/* The conversation about one submission — a recruiter and JobFolder staff
   talking about that specific candidate. Self-fetching so it drops into
   either the recruiter's submission page or the admin detail view with
   nothing more than a submission id and which side is viewing. */
export function MessageThread({
  submissionId,
  role,
}: {
  submissionId: string;
  role: "recruiter" | "admin";
}) {
  const [messages, setMessages] = useState<SubmissionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const list = role === "recruiter" ? listSubmissionMessages : listAdminSubmissionMessages;
  const send = role === "recruiter" ? sendSubmissionMessage : sendAdminSubmissionMessage;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    list(submissionId)
      .then((m) => {
        if (active) setMessages(m);
      })
      .catch(() => active && setError("Could not load messages."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // `list` is a stable function reference for a given `role`, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function submitDraft() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await send(submissionId, text);
      setDraft("");
      setMessages(await list(submissionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid h-32 place-items-center">
            <Loader />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {role === "recruiter"
              ? "No messages yet — ask a question about this candidate below."
              : "No messages yet."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === role;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-primary text-white" : "bg-cream text-ink"
                  }`}
                >
                  <p className={`mb-0.5 text-xs font-semibold ${mine ? "text-white/70" : "text-muted"}`}>
                    {m.senderRole === "admin" ? "JobFolder Team" : m.senderName || "Recruiter"}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[11px] ${mine ? "text-white/60" : "text-muted"}`}>
                    {timeAgo(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">{error}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitDraft();
        }}
        className="mt-3 flex items-end gap-2 border-t border-line pt-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitDraft();
            }
          }}
          placeholder="Write a message…"
          rows={2}
          className="input min-h-0 flex-1 resize-none py-2"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-pill bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
