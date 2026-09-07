import { handle, ok, BadRequest } from "@/lib/server/respond";
import {
  addInboundReply,
  findMessageByReplyToken,
  findLatestMessageFromSender,
} from "@/lib/server/repo";
import { parseThreadAddress, inboundDomain } from "@/lib/server/inboundAddress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Replies coming back in, via Brevo's inbound parsing webhook.
 *
 * Enquiry threads used to be one-directional: an admin's answer went out by
 * email, and whatever came back landed in a shared mailbox with no way to
 * attach it to anything. So the console showed a conversation that stopped
 * after our first message, which is exactly what was reported.
 *
 * Setup this depends on (see INBOUND_REPLY_DOMAIN in lib/server/inboundAddress):
 *   1. A subdomain — e.g. reply.jobfolder.com — with MX pointed at
 *      inbound1.sendinblue.com and inbound2.sendinblue.com. Brevo requires it
 *      to be different from the sending domain.
 *   2. An inbound webhook registered with Brevo pointing at this route.
 *   3. INBOUND_REPLY_DOMAIN set to that subdomain.
 *
 * Until all three exist the route is dormant and outbound mail behaves
 * exactly as before.
 */

/** Brevo posts a batch; shapes vary by plan, so every field is optional. */
type InboundItem = {
  From?: { Address?: string; Name?: string };
  To?: { Address?: string; Name?: string }[];
  Cc?: { Address?: string; Name?: string }[];
  Subject?: string;
  RawTextBody?: string;
  RawHtmlBody?: string;
  ExtractedMarkdownMessage?: string;
};

/* Strips the quoted history off a reply.
 *
 * Without this, every inbound message carries the entire thread beneath it
 * and the console becomes unreadable by the third exchange. These are the
 * common client conventions; anything unrecognised is left whole, because
 * showing too much beats silently truncating someone's actual words. */
function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const cutAt = lines.findIndex((line) => {
    const l = line.trim();
    return (
      /^On .+ wrote:$/i.test(l) ||          // Gmail, Apple Mail
      /^-{2,}\s*Original Message\s*-{2,}$/i.test(l) || // Outlook
      /^_{5,}$/.test(l) ||                   // Outlook's divider rule
      /^From:\s/i.test(l)                    // forwarded header block
    );
  });
  const body = cutAt > 0 ? lines.slice(0, cutAt) : lines;
  // Drop trailing ">" quote lines and blank padding.
  while (body.length && (body[body.length - 1].trim() === "" || body[body.length - 1].startsWith(">"))) {
    body.pop();
  }
  return body.join("\n").trim();
}

export function POST(req: Request) {
  return handle(async () => {
    if (!inboundDomain()) {
      // Nothing is configured to send here, so a request is either a probe or
      // a misconfiguration. Refusing loudly beats writing rows we can't route.
      throw new BadRequest("Inbound replies are not configured.");
    }

    /* Brevo authenticates this by the URL alone — there is no signature to
       verify — so the secrecy of the path is what protects it, plus the
       per-thread token below. A caller who guesses this URL still can't
       write into a thread without also knowing that thread's token. */
    const payload = (await req.json().catch(() => null)) as
      | { items?: InboundItem[] }
      | InboundItem[]
      | null;
    if (!payload) throw new BadRequest("Expected a JSON body.");

    const items: InboundItem[] = Array.isArray(payload) ? payload : payload.items ?? [];
    let stored = 0;
    let unmatched = 0;

    for (const item of items) {
      const fromEmail = item.From?.Address?.trim().toLowerCase() ?? "";
      if (!fromEmail) continue;

      const raw =
        item.ExtractedMarkdownMessage ??
        item.RawTextBody ??
        // Last resort: flatten the HTML part rather than store markup.
        (item.RawHtmlBody ? item.RawHtmlBody.replace(/<[^>]+>/g, " ") : "");
      const body = stripQuotedReply(raw ?? "").slice(0, 20000);
      if (!body) continue;

      /* Addressed match first — it's the only one that's certain. Cc as well
         as To, since a reply-all puts our address in either. */
      const candidates = [...(item.To ?? []), ...(item.Cc ?? [])];
      let thread: { id: number; email: string; name: string } | null = null;

      for (const addr of candidates) {
        const parsed = parseThreadAddress(addr.Address ?? "");
        if (!parsed) continue;
        thread = await findMessageByReplyToken(parsed.id, parsed.token);
        if (thread) break;
      }

      /* Fallback: some clients drop our reply-to and answer the address the
         mail appeared to come from. Attach to that sender's most recent
         thread — ambiguous if they have several, which is why it isn't the
         primary route. */
      if (!thread) thread = await findLatestMessageFromSender(fromEmail);

      if (!thread) {
        unmatched++;
        continue;
      }

      await addInboundReply({
        messageId: thread.id,
        fromName: item.From?.Name ?? thread.name,
        fromEmail,
        body,
      });
      stored++;
    }

    /* Always 200 with a count. Brevo retries on a non-2xx, and an email we
       can't match will never match on a retry — so failing here would mean
       redelivering the same unroutable message indefinitely. */
    return ok({ received: items.length, stored, unmatched });
  });
}
