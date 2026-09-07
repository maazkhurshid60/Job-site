import "server-only";

/* Per-thread reply addresses.
 *
 * A reply to a shared address can't be attached to anything — which is why
 * enquiry threads went one-directional: an admin's answer went out, and the
 * response came back to a mailbox nobody could route from. Addressing each
 * thread separately makes an inbound email self-identifying.
 *
 * Shape: enquiry-<id>-<token>@<INBOUND_REPLY_DOMAIN>
 *
 * The token is a per-thread secret, not decoration. Anyone can email this
 * address, so an id alone would let someone walk sequential numbers and post
 * into other people's conversations.
 *
 * INBOUND_REPLY_DOMAIN must be a subdomain with MX pointed at Brevo, and
 * distinct from the sending domain — Brevo requires the two to differ. Unset
 * means the feature is dormant: mail still sends, using the shared reply-to
 * as before, and nothing breaks.
 */

const PATTERN = /^enquiry-(\d+)-([a-f0-9]{8,64})$/i;

export function inboundDomain(): string | null {
  return process.env.INBOUND_REPLY_DOMAIN?.trim().replace(/^@/, "") || null;
}

export function threadReplyAddress(messageId: number, token: string): string | null {
  const domain = inboundDomain();
  if (!domain || !token) return null;
  return `enquiry-${messageId}-${token}@${domain}`;
}

/** Pulls the thread id and token back out of a To/Cc address. Returns null
    for anything that isn't one of ours, including a different domain. */
export function parseThreadAddress(address: string): { id: number; token: string } | null {
  const domain = inboundDomain();
  if (!domain) return null;

  // "Name <a@b.com>" or a bare address; case-insensitive, as email is.
  const match = address.match(/<([^>]+)>/);
  const bare = (match ? match[1] : address).trim().toLowerCase();

  const [local, host] = bare.split("@");
  if (!local || host !== domain.toLowerCase()) return null;

  const parts = local.match(PATTERN);
  if (!parts) return null;

  const id = Number(parts[1]);
  return Number.isSafeInteger(id) && id > 0 ? { id, token: parts[2] } : null;
}
