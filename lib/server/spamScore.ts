import "server-only";

/* Is this contact-form message spam?
 *
 * WHY THIS EXISTS
 *
 * The contact form's real defence is reCAPTCHA, and reCAPTCHA is unset (see
 * lib/server/recaptcha.ts, which no-ops without a key), so bots POST straight
 * to /api/messages and every one of them emails the client. 135 in a day, by
 * his own count. Keys fix the intake; this fixes the inbox, and it keeps
 * working afterwards, because a solver service can clear a v2 checkbox.
 *
 * THE RULE THIS FOLLOWS
 *
 * Scoring decides whether to EMAIL, never whether to ACCEPT. A message that
 * scores as spam is still written to `messages` exactly as before and still
 * shows in the console, flagged. A false positive therefore costs a delayed
 * reply, not a lost enquiry, which is the only trade worth making when the
 * alternative is a client deleting 135 messages by hand.
 *
 * WHAT IT LOOKS FOR
 *
 * Signals chosen from what actually arrives: SEO and marketing pitches,
 * crypto, link dumps, and bodies that are mostly URL. Each is weak alone,
 * which is why it takes a score rather than a single hit, and why the
 * threshold sits at two independent signals rather than one.
 */

export type SpamVerdict = {
  isSpam: boolean;
  score: number;
  /** Which rules fired, for the console and for tuning this later. */
  reasons: string[];
};

/* Phrases that do not appear in a real enquiry to a recruiting firm. Kept
   deliberately narrow: "marketing" or "website" on their own are things a
   genuine sender might write, so only the pitch formulations are listed. */
const PITCH_PHRASES = [
  "seo services", "seo expert", "seo audit", "first page of google",
  "rank your website", "increase your traffic", "web design services",
  "guest post", "link building", "backlink", "dofollow",
  "digital marketing agency", "lead generation services",
  "bitcoin", "crypto investment", "forex", "binary option",
  "make money online", "work from home opportunity",
  "viagra", "casino", "escort",
  "i came across your website", "i was browsing your site",
  "unsubscribe from future", "this is not spam",
];

const URL_RE = /\bhttps?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}/gi;

export function scoreMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;

  const body = `${input.subject} ${input.message}`;
  const lower = body.toLowerCase();
  const words = input.message.trim().split(/\s+/).filter(Boolean);

  /* Phrases stack, up to a cap.
   *
   * The first version stopped at the first match, and the result was that the
   * commonest spam of all — the SEO pitch — scored 2 against a threshold of
   * 3 and got emailed anyway. That message contained four of these phrases.
   * One pitch phrase is suggestive; four is the whole template. */
  const hits = PITCH_PHRASES.filter((phrase) => lower.includes(phrase));
  if (hits.length > 0) {
    score += Math.min(2 + (hits.length - 1), 4);
    reasons.push(`pitch phrase${hits.length > 1 ? "s" : ""}: ${hits.slice(0, 3).map((h) => `"${h}"`).join(", ")}`);
  }

  const links = body.match(URL_RE) ?? [];
  if (links.length >= 3) {
    score += 2;
    reasons.push(`${links.length} links`);
  } else if (links.length === 2) {
    score += 1;
    reasons.push("2 links");
  } else if (links.length === 1 && words.length < 25) {
    // A short message that exists to deliver a URL.
    score += 1;
    reasons.push("link in a very short message");
  }

  /* Cyrillic, CJK and Arabic in a message to a US recruiting firm whose site,
     forms and job board are entirely in English. Weak on its own, which is
     why it scores 1 and needs company. */
  if (/[Ѐ-ӿ一-鿿؀-ۿ]/.test(body)) {
    score += 1;
    reasons.push("non-Latin script");
  }

  // BBCode and raw HTML tags are forum-spam tooling, not something a person
  // types into a contact form.
  if (/\[url=|\[\/url\]|<a\s+href=/i.test(body)) {
    score += 2;
    reasons.push("markup in the body");
  }

  if (words.length > 8 && input.message === input.message.toUpperCase()) {
    score += 1;
    reasons.push("all caps");
  }

  /* The name field carrying a URL or an email address. A person writes their
     name here; a script pastes its payload into every field it finds. */
  if (URL_RE.test(input.name) || input.name.includes("@")) {
    score += 2;
    reasons.push("name field contains a link or address");
  }

  return { isSpam: score >= 3, score, reasons };
}
