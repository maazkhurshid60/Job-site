"use client";

import { useSearchParams } from "next/navigation";

/* Where to send someone after they sign in.

   Reads ?next= so a recruiter who hit "Log in" from a job page lands back on
   that job to finish submitting, rather than on the dashboard.

   Only same-origin absolute paths are honoured. Without that check, ?next= is
   an open redirect: a link to our own login page could bounce a signed-in user
   to an attacker's site, which is a convincing phishing primitive because the
   link they clicked really was ours. "//evil.com" is rejected too — the browser
   reads a protocol-relative URL as a different host. */
export function useNextPath(fallback = "/dashboard"): string {
  const params = useSearchParams();
  const next = params.get("next");

  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;

  return next;
}
