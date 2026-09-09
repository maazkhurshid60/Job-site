/* A candidate's right to work in the United States.
 *
 * Asked because it decides whether a submission is worth screening at all:
 * a great CV for a CTDOT resident-engineer role is still a no if the role
 * cannot sponsor and the candidate needs it. Recruiters were leaving it in
 * free-text notes, or not saying, and it was being discovered on a call.
 *
 * Stored as the code, displayed as the label, so the wording can be changed
 * without rewriting rows. "" is a real and meaningful value: it means the
 * submission predates this field, NOT that the candidate declined to say —
 * `PREFER_NOT_TO_SAY` is for that. Keeping those distinct matters, because
 * one is our gap and the other is the candidate's answer.
 */

export const WORK_AUTHORIZATION = [
  { code: "us_citizen", label: "US citizen" },
  { code: "green_card", label: "Green card (permanent resident)" },
  { code: "ead", label: "EAD — OPT, CPT or other" },
  { code: "h1b", label: "H-1B" },
  { code: "tn", label: "TN (Canada / Mexico)" },
  { code: "other_authorized", label: "Other — authorised without sponsorship" },
  { code: "needs_sponsorship", label: "Requires sponsorship now or in future" },
  { code: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type WorkAuthorizationCode = (typeof WORK_AUTHORIZATION)[number]["code"];

const LABELS = new Map<string, string>(WORK_AUTHORIZATION.map((o) => [o.code, o.label]));

/** Longest code, so the column can be sized without guessing. */
export const WORK_AUTHORIZATION_MAX = Math.max(...WORK_AUTHORIZATION.map((o) => o.code.length));

/** True for a code we actually offer. "" is allowed — see the note above. */
export function isWorkAuthorization(v: unknown): v is WorkAuthorizationCode | "" {
  return typeof v === "string" && (v === "" || LABELS.has(v));
}

/**
 * Display text. An unrecognised code is returned as-is rather than hidden:
 * if a value we no longer offer is in the database, showing it is more
 * useful than pretending the field is empty.
 */
export function workAuthorizationLabel(code: string): string {
  if (!code) return "Not provided";
  return LABELS.get(code) ?? code;
}
