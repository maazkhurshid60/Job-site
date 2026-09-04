import "server-only";
import { ConfigError } from "./respond";
import { renderEmail, type EmailContent } from "./emailTemplate";

/* Outgoing email, via the same Brevo account already used for the Patrick
   Novick / Metro Associates mailer (BREVO_API_KEY reused — it's one account,
   not tied to a single sending domain).

   The layout lives in ./emailTemplate; everything here is just content plus
   the Brevo call, so the two emails below can't drift apart visually. */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(
      `The server is missing ${name}, so notification emails can't be sent. Add it to the deployment's environment variables and redeploy.`,
    );
  }
  return value;
}

type SendInput = {
  to: { email: string; name?: string };
  subject: string;
  content: EmailContent;
  /** Overrides BREVO_REPLY_TO_EMAIL — the contact form points replies at the
      person who submitted it rather than at our own inbox. */
  replyTo?: { email: string; name?: string };
};

/* One place that talks to Brevo, so the sender identity, the text/plain part
   and the error handling are identical for every email we send. */
async function send({ to, subject, content, replyTo }: SendInput): Promise<void> {
  const apiKey = requireEnv("BREVO_API_KEY");
  const senderEmail = requireEnv("BREVO_SENDER_EMAIL");
  const senderName = process.env.BREVO_SENDER_NAME ?? "JobFolder";

  /* We send from a noreply@ address nobody reads. Anyone who hits "reply"
     would be writing into a void, so fall back to the monitored inbox.
     Unset = no replyTo, which is the old behaviour rather than a broken
     header pointing somewhere that bounces. */
  const fallbackReplyTo = process.env.BREVO_REPLY_TO_EMAIL;
  const resolvedReplyTo =
    replyTo ?? (fallbackReplyTo ? { email: fallbackReplyTo, name: senderName } : undefined);

  const { html, text } = renderEmail(content);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [to],
      ...(resolvedReplyTo ? { replyTo: resolvedReplyTo } : {}),
      subject,
      htmlContent: html,
      textContent: text,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo send failed: ${res.status} ${body}`);
  }
}

/* Contact-form → our inbox. Best-effort: the caller
   (app/api/messages/route.ts) catches and logs a failure rather than letting
   a Brevo outage break the contact form, since the message itself is already
   safely written to the `messages` table before this runs. */
export async function notifyNewMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await send({
    to: { email: process.env.CONTACT_NOTIFY_EMAIL ?? "hello@jobfolder.com" },
    subject: `New contact form message: ${input.subject || "(no subject)"}`,
    // Reply goes to the submitter, so hitting "reply" in the inbox answers
    // them directly instead of landing back on our own sending address.
    replyTo: { email: input.email, name: input.name || input.email },
    content: {
      preheader: `${input.name || "Someone"}: ${input.subject || "(no subject)"}`,
      paragraphs: ["Someone submitted the contact form on jobfolder.com."],
      fields: [
        { label: "Name", value: input.name || "(not given)" },
        { label: "Email", value: input.email },
        { label: "Subject", value: input.subject || "(no subject)" },
      ],
      // Their message last, so it reads as the body rather than as metadata.
      quote: input.message,
      footerNote: "Reply to this email to answer them directly.",
    },
  });
}

/** Admin-triggered: nudge a recruiter to finish their profile. Sent TO the
    recruiter (not our inbox) — the opposite direction from notifyNewMessage. */
export async function notifyProfileReminder(input: {
  name: string;
  email: string;
  missingLabels: string[];
  profileUrl: string;
}): Promise<void> {
  await send({
    to: { email: input.email, name: input.name || input.email },
    subject: "Finish setting up your JobFolder profile",
    content: {
      preheader: `${input.missingLabels.length} thing${input.missingLabels.length === 1 ? "" : "s"} left on your recruiter profile.`,
      greeting: `Hi ${input.name || "there"},`,
      paragraphs: [
        "Your JobFolder recruiter profile is missing a few details that help our team (and our clients) know who they're working with:",
      ],
      bullets: input.missingLabels,
      button: { label: "Finish your profile", url: input.profileUrl },
      footerNote:
        "You're receiving this because you have a recruiter account on JobFolder.",
    },
  });
}

/** Someone contacted a recruiter through their microsite. Goes TO the
    recruiter — they own the relationship, so the lead should reach them
    directly rather than sitting in our console waiting to be forwarded.
    Reply-to is the enquirer, so hitting "reply" answers them. */
export async function notifySiteLead(input: {
  recruiterName: string;
  recruiterEmail: string;
  lead: { name: string; email: string; phone: string; message: string };
}): Promise<void> {
  const { lead } = input;
  const who = lead.name || lead.email;

  await send({
    to: { email: input.recruiterEmail, name: input.recruiterName || input.recruiterEmail },
    subject: `New enquiry from your JobFolder site: ${who}`,
    replyTo: { email: lead.email, name: lead.name || lead.email },
    content: {
      preheader: `${who} got in touch through your recruiter site.`,
      greeting: `Hi ${input.recruiterName || "there"},`,
      paragraphs: ["Someone used the contact form on your JobFolder recruiter site."],
      fields: [
        { label: "Name", value: lead.name || "(not given)" },
        { label: "Email", value: lead.email },
        ...(lead.phone ? [{ label: "Phone", value: lead.phone }] : []),
      ],
      quote: lead.message,
      footerNote: "Reply to this email to answer them directly. This enquiry is also saved on your JobFolder dashboard.",
    },
  });
}
