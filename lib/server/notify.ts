import "server-only";
import { ConfigError } from "./respond";

/* Contact-form → email notification, via the same Brevo account already used
   for the Patrick Novick / Metro Associates mailer (BREVO_API_KEY reused —
   it's one account, not tied to a single sending domain). This is best-effort:
   the caller (app/api/messages/route.ts) catches and logs a failure here
   rather than letting a Brevo outage break the contact form, since the
   message itself is already safely written to the `messages` table before
   this runs. */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(
      `The server is missing ${name}, so contact-form notification emails can't be sent. Add it to the deployment's environment variables and redeploy.`,
    );
  }
  return value;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

export async function notifyNewMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = requireEnv("BREVO_API_KEY");
  const senderEmail = requireEnv("BREVO_SENDER_EMAIL");
  const senderName = process.env.BREVO_SENDER_NAME ?? "JobFolder";
  const to = process.env.CONTACT_NOTIFY_EMAIL ?? "hello@jobfolder.com";

  const html = `
    <p><strong>New contact form submission</strong></p>
    <p>
      <strong>Name:</strong> ${escapeHtml(input.name || "(not given)")}<br/>
      <strong>Email:</strong> ${escapeHtml(input.email)}<br/>
      <strong>Subject:</strong> ${escapeHtml(input.subject || "(no subject)")}
    </p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br/>")}</p>
  `;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      // Reply-to the submitter, so hitting "reply" in the inbox goes straight
      // back to them instead of to the shared sending address.
      replyTo: { email: input.email, name: input.name || input.email },
      subject: `New contact form message: ${input.subject || "(no subject)"}`,
      htmlContent: html,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Brevo notification failed: ${res.status} ${text}`);
  }
}

/** Admin-triggered: nudge a recruiter to finish their profile. Sent TO the
    recruiter (not the admin inbox) — the opposite direction from
    notifyNewMessage above. Same Brevo account/sender, so a missing
    BREVO_API_KEY surfaces the same ConfigError either way. */
export async function notifyProfileReminder(input: {
  name: string;
  email: string;
  missingLabels: string[];
  profileUrl: string;
}): Promise<void> {
  const apiKey = requireEnv("BREVO_API_KEY");
  const senderEmail = requireEnv("BREVO_SENDER_EMAIL");
  const senderName = process.env.BREVO_SENDER_NAME ?? "JobFolder";

  const missingList = input.missingLabels.map((l) => `<li>${escapeHtml(l)}</li>`).join("");

  const html = `
    <p>Hi ${escapeHtml(input.name || "there")},</p>
    <p>
      Your JobFolder recruiter profile is missing a few details that help our
      team (and clients) know who they're working with:
    </p>
    <ul>${missingList}</ul>
    <p><a href="${input.profileUrl}">Finish your profile</a> — it only takes a minute.</p>
  `;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: input.email, name: input.name || input.email }],
      subject: "Finish setting up your JobFolder profile",
      htmlContent: html,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Brevo notification failed: ${res.status} ${text}`);
  }
}
