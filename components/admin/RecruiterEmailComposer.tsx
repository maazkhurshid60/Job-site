"use client";

import { useState } from "react";
import { sendRecruiterEmail } from "@/lib/users";
import {
  ADMIN_EMAIL_TEMPLATES,
  adminEmailTemplate,
  fillTemplate,
} from "@/lib/adminEmailTemplates";

/* Compose an email to one recruiter, sent from noreply@jobfolder.com on the
 * JobFolder letterhead.
 *
 * Templates load a starting subject and body, then get out of the way — the
 * admin edits both before sending. A template nobody can adjust gets used
 * for the wrong situation, and the cost of that is an email that reads like
 * a form letter.
 *
 * {name} is substituted here for the preview and again on the server at
 * send time, so what the admin reads is what the recruiter gets.
 */
export function RecruiterEmailComposer({
  uid,
  recruiterName,
  recruiterEmail,
  onSent,
}: {
  uid: string;
  recruiterName: string;
  recruiterEmail: string;
  onSent: (subject: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("blank");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickTemplate(id: string) {
    setTemplateId(id);
    const t = adminEmailTemplate(id);
    if (!t) return;
    /* Overwrites whatever is in the box. Switching template is an explicit
       act, and silently merging the two would produce a message that is
       neither. */
    setSubject(t.subject);
    setBody(fillTemplate(t.body, recruiterName));
  }

  async function send() {
    if (!subject.trim() || !body.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendRecruiterEmail(uid, { templateId, subject: subject.trim(), body: body.trim() });
      onSent(subject.trim());
      setOpen(false);
      setTemplateId("blank");
      setSubject("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that email.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!recruiterEmail}
        className="shrink-0 rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        title={recruiterEmail ? `Email ${recruiterEmail}` : "No email address on file"}
      >
        Send email
      </button>
    );
  }

  const cta = adminEmailTemplate(templateId)?.cta;

  return (
    <div className="mt-3 w-full rounded-xl border border-line bg-cream/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">
          Email to <span className="text-primary">{recruiterEmail}</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          Close
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Start from
        </span>
        <select
          value={templateId}
          onChange={(e) => pickTemplate(e.target.value)}
          className="input mt-1 h-9 text-sm"
        >
          {ADMIN_EMAIL_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 text-[11px] text-muted">{adminEmailTemplate(templateId)?.hint}</p>

      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        maxLength={255}
        className="input mt-3 h-9 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your message. Leave a blank line between paragraphs."
        className="input mt-2 min-h-40 resize-y text-sm"
      />

      <p className="mt-2 text-[11px] text-muted">
        Sent from <strong>Jobfolder &lt;noreply@jobfolder.com&gt;</strong> on the JobFolder
        letterhead. {cta ? `Includes a "${cta.label}" button.` : "No button."} Replies come back
        to the team inbox.
      </p>

      {error && <p className="mt-2 text-xs text-coral">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={send}
          disabled={sending || !subject.trim() || !body.trim()}
          className="rounded-pill bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send email"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={sending}
          className="rounded-pill border border-line px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink/25"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
