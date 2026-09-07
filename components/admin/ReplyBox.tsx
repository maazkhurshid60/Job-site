"use client";

import { useState } from "react";

/* Compose box for one enquiry, shared by the inbox list and the thread page.
 *
 * Local state so typing doesn't re-render the list around it, and send is
 * disabled on an empty message — an accidental blank reply still emails the
 * sender. `onCancel` is optional: on the list the box is opened per row and
 * needs a way out, on the thread page it is simply always there.
 */
export function ReplyBox({
  onSend,
  onCancel,
  autoFocus = true,
  placeholder = "Write your reply — it's emailed to them and kept on this thread.",
}: {
  onSend: (text: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="input min-h-28 resize-y text-sm"
      />
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={sending || !text.trim()}
          className="rounded-pill bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send reply"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="rounded-pill border border-line px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink/25"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
