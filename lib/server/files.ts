import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { ConfigError } from "./respond";

/* Signed, expiring URLs for CV and verification-video downloads.

   Why this exists: a CV is candidate PII — name, address, employment history.
   The old Firebase Storage rule was `allow read: if true`, protected only by an
   unguessable URL. Anyone who ever saw a link kept permanent access, and a
   leaked link was a permanent leak.

   Here the file id is a UUID *and* the URL carries an expiry plus an HMAC over
   (id, expiry). Links are minted server-side only when returning a submission
   or recruiter profile the caller was already allowed to read, so the ability
   to download a CV or watch a verification video follows the ability to see
   that record, and it lapses on its own.

   Avatars are not signed: they are low-sensitivity profile photos that have to
   render in an <img> tag, which cannot send an Authorization header. A
   verification video is a recruiter's face and voice, not a public profile
   photo, so it gets the CV treatment instead. */

const TTL_SECONDS = 60 * 60; // 1 hour — long enough to read, short enough to rot

/* Note where this throws from: signedFileUrl() runs while SERIALISING a
   submission, so a missing secret doesn't just break CV downloads — it takes
   down the whole submissions list, and only once the first CV exists. That
   delayed, misleading failure is why this raises a ConfigError, whose message
   reaches the signed-in operator instead of being masked. */
function secret(): string {
  const value = process.env.FILE_URL_SECRET;
  if (!value || value.length < 32) {
    throw new ConfigError(
      "The server is missing FILE_URL_SECRET (needs 32+ characters), so CV links can't be signed. Add it to the deployment's environment variables and redeploy.",
    );
  }
  return value;
}

function sign(id: string, expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(`${id}.${expiresAt}`)
    .digest("hex");
}

/** A relative, time-limited download URL for a CV or verification video. */
export function signedFileUrl(id: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return `/api/files/${id}?exp=${expiresAt}&sig=${sign(id, expiresAt)}`;
}

/** Verify the exp/sig pair on an incoming CV/video download request. */
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

/* 4 MB, not 10 — Vercel rejects a request body over ~4.5 MB before this
   route ever runs, so a higher limit here would just mean the platform
   fails the upload with an opaque 413 instead of this friendly message.
   Keep in sync with lib/cv.ts, the client-side copy of this same limit. */
export const MAX_CV_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
// Same 4 MB ceiling as CVs, for the same reason (Vercel's ~4.5 MB request-body
// limit) — a short (~10s) phone video at modest resolution fits comfortably.
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024; // 4 MB

export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const newFileId = () => randomUUID();

export type FileKind = "cv" | "avatar" | "video";

const KIND_RULES: Record<
  FileKind,
  { types: string[]; max: number; label: string }
> = {
  cv: {
    types: ACCEPTED_CV_TYPES,
    max: MAX_CV_BYTES,
    label: "CV must be a PDF or Word document.",
  },
  avatar: {
    types: ACCEPTED_AVATAR_TYPES,
    max: MAX_AVATAR_BYTES,
    label: "Image must be a JPG, PNG, or WebP.",
  },
  video: {
    types: ACCEPTED_VIDEO_TYPES,
    max: MAX_VIDEO_BYTES,
    label: "Video must be MP4, WebM, or MOV.",
  },
};

/** The upload-route recheck (actual bytes received vs. the declared max)
    needs to know which cap applies to which kind — see app/api/files/route.ts. */
export function maxBytesFor(kind: FileKind): number {
  return KIND_RULES[kind].max;
}

/* Content-Type is attacker-controlled, so it decides nothing on its own — the
   download route always serves CVs as an attachment. This is a UX filter, not
   a security boundary. */
export function validateUpload(
  kind: FileKind,
  contentType: string,
  size: number,
): string | null {
  const { types, max, label } = KIND_RULES[kind];

  if (size <= 0) return "File is empty.";
  if (size > max) {
    return `File is larger than ${Math.round(max / 1048576)} MB.`;
  }
  if (!types.includes(contentType)) return label;
  return null;
}

/** Strip anything that could confuse a Content-Disposition header. */
export function safeFilename(name: string): string {
  return (name || "file").replace(/[^\w.\- ]+/g, "_").slice(0, 200);
}
