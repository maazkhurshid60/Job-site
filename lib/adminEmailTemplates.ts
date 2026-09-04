/* Starting points for an admin emailing one recruiter from the console.
 *
 * These are drafts, not locked templates: the compose box loads the subject
 * and body, and the admin edits both before sending. That's deliberate —
 * a template nobody can adjust gets used for the wrong situation, and the
 * cost of a stale one is an email that reads like a form letter.
 *
 * Kept in code rather than in Brevo's dashboard so the wording is
 * reviewable and versioned alongside everything else. The trade-off is that
 * changing the copy needs a deploy; if that becomes a nuisance, moving them
 * to Brevo templateIds is a contained change — only `body` and `subject`
 * below would move.
 *
 * {name} is the only placeholder, replaced with the recruiter's first name
 * (or "there" when we don't have one). Anything more elaborate belongs in
 * the body the admin actually writes.
 */

export type AdminEmailTemplate = {
  id: string;
  label: string;
  /** Shown under the picker, so an admin can tell two similar ones apart. */
  hint: string;
  subject: string;
  body: string;
  /** Optional button. The admin can't edit this, so it stays a fixed,
      safe destination inside the recruiter's own dashboard. */
  cta?: { label: string; path: string };
};

export const ADMIN_EMAIL_TEMPLATES: AdminEmailTemplate[] = [
  {
    id: "blank",
    label: "Write from scratch",
    hint: "An empty message on the JobFolder letterhead.",
    subject: "",
    body: "",
  },
  {
    id: "verification-video",
    label: "Ask for the verification video",
    hint: "For a recruiter who has filled in everything except the video.",
    subject: "One last step to verify your JobFolder account",
    body:
      "Hi {name},\n\n" +
      "Thanks for setting up your JobFolder profile. The last thing we need before we can verify your account is a short video — about ten seconds, just you saying your name and who you recruit for.\n\n" +
      "It's how we confirm the people on our network are who they say they are, which is what lets us hand out live roles and published fees.\n\n" +
      "You can upload it on your profile page.",
    cta: { label: "Upload your video", path: "/dashboard/profile" },
  },
  {
    id: "verified",
    label: "Confirm they're verified",
    hint: "Send after ticking Verified, so they know they can start.",
    subject: "You're verified on JobFolder",
    body:
      "Hi {name},\n\n" +
      "Your JobFolder account is verified. You can now see every open role on the board, along with the fee each one pays on a confirmed hire.\n\n" +
      "If you have someone in mind for a role, submit them from the job page and we'll take it from there.",
    cta: { label: "Browse open roles", path: "/dashboard/jobs" },
  },
  {
    id: "new-roles",
    label: "Point them at new roles",
    hint: "For a verified recruiter who hasn't submitted anyone yet.",
    subject: "New roles on JobFolder that might suit your desk",
    body:
      "Hi {name},\n\n" +
      "We've added a number of new roles to the board that look close to the work you do. Each one shows the fee it pays on a confirmed hire before you submit anyone.\n\n" +
      "Worth a look when you have a moment.",
    cta: { label: "See the roles", path: "/dashboard/jobs" },
  },
  {
    id: "checking-in",
    label: "Check in",
    hint: "A short nudge for someone who has gone quiet.",
    subject: "Checking in from JobFolder",
    body:
      "Hi {name},\n\n" +
      "Just checking in — is there anything holding you up on JobFolder, or any kind of role you'd like to see more of?\n\n" +
      "Reply to this email and it comes straight back to our team.",
  },
];

export function adminEmailTemplate(id: string): AdminEmailTemplate | null {
  return ADMIN_EMAIL_TEMPLATES.find((t) => t.id === id) ?? null;
}

/** Substitutes {name}. Applied on the server at send time as well as in the
    preview, so what the admin sees is what goes out. */
export function fillTemplate(text: string, recruiterName: string): string {
  const first = recruiterName.trim().split(/\s+/)[0] || "there";
  return text.replace(/\{name\}/g, first);
}
