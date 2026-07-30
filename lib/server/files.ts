import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

/* Signed, expiring URLs for CV downloads.

   Why this exists: a CV is candidate PII — name, address, employment history.
   The old Firebase Storage rule was `allow read: if true`, protected only by an
   unguessable URL. Anyone who ever saw a link kept permanent access, and a
   leaked link was a permanent leak.

   Here the file id is a UUID *and* the URL carries an expiry plus an HMAC over
   (id, expiry). Links are minted server-side only when returning a submission
   the caller was already allowed to read, so the ability to download a CV
   follows the ability to see the submission, and it lapses on its own.

   Avatars are not signed: they are low-sensitivity profile photos that have to
   render in an <img> tag, which cannot send an Authorization header. */

const TTL_SECONDS = 60 * 60; // 1 hour — long enough to read, short enough to rot

function secret(): string {
  const value = process.env.FILE_URL_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "FILE_URL_SECRET is missing or too short (needs 32+ chars). Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return value;
}

function sign(id: string, expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(`${id}.${expiresAt}`)
    .digest("hex");
}

/** A relative, time-limited download URL for a CV. */
export function signedFileUrl(id: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return `/api/files/${id}?exp=${expiresAt}&sig=${sign(id, expiresAt)}`;
}

/** Verify the exp/sig pair on an incoming CV download request. */
export function verifyFileUrl(
  id: string,
  exp: string | null,
  sig: string | null,
): boolean {
  if (!exp || !sig) return false;

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(id, expiresAt), "utf8");
  const actual = Buffer.from(sig, "utf8");
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/* ------------------------------------------------------------- validation */

export const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const newFileId = () => randomUUID();

/* Content-Type is attacker-controlled, so it decides nothing on its own — the
   download route always serves CVs as an attachment. This is a UX filter, not
   a security boundary. */
export function validateUpload(
  kind: "cv" | "avatar",
  contentType: string,
  size: number,
): string | null {
  const [types, max, label] =
    kind === "cv"
      ? [ACCEPTED_CV_TYPES, MAX_CV_BYTES, "CV must be a PDF or Word document."]
      : [ACCEPTED_AVATAR_TYPES, MAX_AVATAR_BYTES, "Image must be a JPG, PNG, or WebP."];

  if (size <= 0) return "File is empty.";
  if (size > (max as number)) {
    return `File is larger than ${Math.round((max as number) / 1048576)} MB.`;
  }
  if (!(types as string[]).includes(contentType)) return label as string;
  return null;
}

/** Strip anything that could confuse a Content-Disposition header. */
export function safeFilename(name: string): string {
  return (name || "file").replace(/[^\w.\- ]+/g, "_").slice(0, 200);
}
