import "server-only";
import { BadRequest } from "./respond";

/* Server-side check for the contact form's Google reCAPTCHA v2 checkbox —
   what actually stops a bot POSTing straight to /api/messages without ever
   loading the page (the real spam already sitting in `messages` got in
   exactly that way).

   RECAPTCHA_SECRET_KEY isn't set yet (see .env.local for how to get one) —
   until it is, this intentionally no-ops rather than throwing a ConfigError,
   so the contact form keeps working today instead of breaking outright.
   Once the key is added, verification becomes a hard requirement with no
   further code changes needed. */
export async function verifyRecaptcha(token: string | undefined): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn("[contact] RECAPTCHA_SECRET_KEY not set — skipping CAPTCHA verification.");
    return;
  }
  if (!token) throw new BadRequest("Please complete the CAPTCHA verification.");

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
    cache: "no-store",
  });
  const data = (await res.json()) as { success?: boolean };
  if (!data.success) throw new BadRequest("CAPTCHA verification failed. Please try again.");
}
