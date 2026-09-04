import { handle, ok, jsonBody, str, NotFound, TooManyRequests } from "@/lib/server/respond";
import { createSiteLead, countRecentSiteLeadsFromIp, getPublishedSiteOwner } from "@/lib/server/repo";
import { notifySiteLead } from "@/lib/server/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_SECONDS = 600; // 10 minutes
const RATE_LIMIT_MAX = 5;

/** Vercel (and most reverse proxies) set x-forwarded-for to
    "client, proxy1, proxy2" — the first entry is the real client. Null
    locally, where neither header is set: rate limiting is a no-op there,
    not a crash. */
function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/* Public: someone contacting a recruiter through their microsite.
 *
 * The recruiter is resolved from the slug in the URL, never from the request
 * body — otherwise anyone could file leads against any recruiter by posting
 * a different id. An unpublished site has no owner as far as this is
 * concerned, so a lead can't be filed against a site that isn't live. */
export function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await params;

    const owner = await getPublishedSiteOwner(slug);
    // Same 404 whether the site is missing or merely unpublished — an
    // unpublished slug isn't public information.
    if (!owner) throw new NotFound("That page is no longer available.");

    const ip = clientIp(req);
    if (ip && (await countRecentSiteLeadsFromIp(ip, RATE_LIMIT_WINDOW_SECONDS)) >= RATE_LIMIT_MAX) {
      throw new TooManyRequests("Too many messages sent recently. Please try again in a few minutes.");
    }

    const body = await jsonBody(req);
    const input = {
      name: str(body.name, "name", { max: 255 }),
      email: str(body.email, "email", { max: 320, required: true }),
      phone: str(body.phone, "phone", { max: 64 }),
      message: str(body.message, "message", { required: true }),
    };

    await createSiteLead({ ...input, recruiterId: owner.uid, ip });

    /* Best-effort, and deliberately after the row is written: an email
       failure must not lose the lead or fail the sender's submission. The
       recruiter can still find it on their dashboard either way. */
    try {
      await notifySiteLead({
        recruiterName: owner.name,
        recruiterEmail: owner.email,
        lead: input,
      });
    } catch (err) {
      console.error("[site-lead] notification email failed:", err);
    }

    return ok({ sent: true }, { status: 201 });
  });
}
