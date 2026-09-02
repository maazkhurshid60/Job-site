import type { UserProfile } from "./users";

/* How complete a recruiter's profile is.
 *
 * Signing in now creates the profile row (see GET /api/me), so every recruiter
 * starts with a real but nearly empty profile. This turns "nearly empty" into
 * something they can see and act on.
 *
 * `email` is deliberately not counted: it comes from the account and can't be
 * edited here, so counting it would hand out free progress for nothing the
 * recruiter did. Everything below is a field they can actually fill in. */

export type ProfileField = {
  key: keyof Pick<
    UserProfile,
    | "name" | "photoURL" | "company" | "headline" | "phone" | "location"
    | "linkedin" | "bio" | "verificationVideoId"
  >;
  label: string;
};

/* Ordered by how much it helps our team place work with this recruiter, so the
   "missing" list reads as a sensible to-do rather than form order.

   The verification video is in here rather than off to one side because this
   list is the only thing that actually asks a recruiter for anything: it
   drives the progress meter on their profile, the "still missing" chips, and
   the labels in the admin's reminder email. Left out, the meter reads 100%
   with no video on file and nobody is ever prompted for one. */
export const PROFILE_FIELDS: ProfileField[] = [
  { key: "name", label: "Full name" },
  { key: "company", label: "Company or agency" },
  { key: "headline", label: "Your role" },
  { key: "verificationVideoId", label: "Verification video" },
  { key: "phone", label: "Phone number" },
  { key: "photoURL", label: "Profile photo" },
  { key: "location", label: "Location" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "bio", label: "Short bio" },
];

export type Completion = {
  filled: number;
  total: number;
  /** 0–100, rounded. */
  percent: number;
  missing: ProfileField[];
  isComplete: boolean;
};

export function profileCompletion(profile: UserProfile | null): Completion {
  const total = PROFILE_FIELDS.length;
  if (!profile) {
    return { filled: 0, total, percent: 0, missing: PROFILE_FIELDS, isComplete: false };
  }

  // Whitespace isn't an answer — " " shouldn't count as a filled field.
  const missing = PROFILE_FIELDS.filter((f) => !String(profile[f.key] ?? "").trim());
  const filled = total - missing.length;

  return {
    filled,
    total,
    percent: Math.round((filled / total) * 100),
    missing,
    isComplete: missing.length === 0,
  };
}
