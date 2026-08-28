import { handle, ok, jsonBody, str, TooManyRequests } from "@/lib/server/respond";
import { createMessage, listMessages, countRecentMessagesFromIp } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { notifyNewMessage } from "@/lib/server/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_SECONDS = 600; // 10 minutes
const RATE_LIMIT_MAX = 5;

/** Vercel (and most reverse proxies) set x-forwarded-for to
    "client, proxy1, proxy2" — the first entry is the real client. Falls back
    to x-real-ip for anything else fronting this app. Null locally, where
    neither header is set — rate limiting is a no-op there, not a crash. */
function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/** Public: contact form. Mirrors the old rule — email and message required.
    reCAPTCHA (lib/server/recaptcha.ts) is the primary defense against bots
    posting straight to this route; this IP-based cap is the backstop for
    while that's unset, or for anything that gets past it. */
export function POST(req: Request) {
  return handle(async () => {
    const body = await jsonBody(req);
    await verifyRecaptcha(typeof body.recaptchaToken === "string" ? body.recaptchaToken : undefined);

    const ip = clientIp(req);
    if (ip && (await countRecentMessagesFromIp(ip, RATE_LIMIT_WINDOW_SECONDS)) >= RATE_LIMIT_MAX) {
      throw new TooManyRequests("Too many messages sent recently. Please try again in a few minutes.");
    }

    const input = {
      name: str(body.name, "name", { max: 255 }),
      email: str(body.email, "email", { max: 320, required: true }),
      subject: str(body.subject, "subject", { max: 255 }),
      message: str(body.message, "message", { required: true }),
    };
    await createMessage({ ...input, ip });

    // Best-effort: the message is already saved above, so a Brevo hiccup
    // shouldn't turn into a failed submission for the sender. Awaited (not
    // fire-and-forget) since a serverless function can be frozen the moment
    // it returns, which would silently drop an un-awaited request.
    try {
      await notifyNewMessage(input);
    } catch (err) {
      console.error("[contact] notification email failed:", err);
    }

    // No echo of the stored row: nothing here is useful to the sender.
    return ok({ sent: true }, { status: 201 });
  });
}

/** Admin: read enquiries. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listMessages());
  });
}
