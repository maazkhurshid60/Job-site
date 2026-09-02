import "server-only";
import { SITE_URL } from "../seo";

/* The shared layout for every email JobFolder sends.
 *
 * Before this, each send hand-rolled a few <p> tags, so recruiters got an
 * unstyled wall of text from a domain they'd never seen — which reads as
 * phishing rather than as us. One layout here means a branding change happens
 * once, and a new email can't accidentally ship unbranded.
 *
 * Why it looks like 2003 HTML: email clients are not browsers. Gmail strips
 * <head><style>, Outlook renders through Word, and neither supports flexbox,
 * grid, or external stylesheets. Nested tables with inline styles and
 * explicit widths are the only thing that survives all of them, so the
 * ugliness here is load-bearing — please don't "modernise" it.
 *
 * Callers pass PLAIN TEXT, never HTML. Escaping happens in here so a
 * recruiter whose display name contains "<" can't break the layout or inject
 * markup into an email we send on their behalf.
 */

const BRAND = "#224fa8"; // --color-primary, app/globals.css
const BRAND_DARK = "#123173"; // --color-primary-dark
const INK = "#17130f"; // --color-ink
const MUTED = "#6f6a63"; // --color-muted
const LINE = "#ece5db"; // --color-line
const PAGE_BG = "#f1f5fa"; // --color-blue-brand-soft

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

/* Only http(s) survives. A `javascript:` or `data:` href in an email is
   inert in most clients and a red flag in the rest, and every URL we build
   is one of ours — so a non-http value means a bug upstream, not a link. */
function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? escapeHtml(url) : escapeHtml(SITE_URL);
}

export type EmailField = { label: string; value: string };

export type EmailContent = {
  /** The grey preview line inboxes show next to the subject. Without it,
      Gmail previews the first words of the body, which is usually "Hi ,". */
  preheader: string;
  /** e.g. "Hi Imran," — omitted for machine-to-machine notifications. */
  greeting?: string;
  /** Body copy, one <p> each. */
  paragraphs?: string[];
  /** Label/value rows — used by the contact-form notification. */
  fields?: EmailField[];
  /** Something a third party wrote, shown as a quoted block so it reads as
      their words rather than ours. Line breaks are preserved. */
  quote?: string;
  /** Bulleted list, e.g. the profile fields still missing. */
  bullets?: string[];
  button?: { label: string; url: string };
  /** Small print under the divider, explaining why this arrived. */
  footerNote: string;
};

/** Renders `content` into the HTML and plain-text halves of one email.
 *  Both are returned because sending HTML alone hurts deliverability —
 *  spam filters read a missing text/plain part as a bulk-mailer signal. */
export function renderEmail(content: EmailContent): { html: string; text: string } {
  const { preheader, greeting, paragraphs = [], fields = [], quote, bullets = [], button, footerNote } = content;

  const p = (s: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${escapeHtml(s)}</p>`;

  const fieldRows = fields
    .map(
      (f) => `<tr>
            <td style="padding:0 0 6px;font-size:15px;line-height:1.5;color:${INK};">
              <strong style="color:${MUTED};font-weight:600;">${escapeHtml(f.label)}:</strong>
              ${escapeHtml(f.value)}
            </td>
          </tr>`,
    )
    .join("");

  const fieldsBlock = fields.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
              style="margin:0 0 20px;padding:16px;background:${PAGE_BG};border-radius:8px;">
         ${fieldRows}
       </table>`
    : "";

  /* Escaped first, then newlines become <br> — doing it the other way round
     would let a submitted message inject markup into the email we send. */
  const quoteBlock = quote
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
         <tr>
           <td style="padding:2px 0 2px 16px;border-left:3px solid ${LINE};
                      font-size:16px;line-height:1.6;color:${INK};">${escapeHtml(quote).replace(/\r?\n/g, "<br>")}</td>
         </tr>
       </table>`
    : "";

  /* Bullets get explicit margins because Outlook and Gmail disagree on the
     default list indent, and the difference is very visible at this width. */
  const bulletsBlock = bullets.length
    ? `<ul style="margin:0 0 20px;padding-left:22px;">${bullets
        .map(
          (b) =>
            `<li style="margin:0 0 8px;font-size:16px;line-height:1.5;color:${INK};">${escapeHtml(b)}</li>`,
        )
        .join("")}</ul>`
    : "";

  /* A table cell with a background, not a styled <a>: Outlook drops
     background-color on inline elements, which would leave blue text on
     white where the button should be. */
  const buttonBlock = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
         <tr>
           <td align="center" bgcolor="${BRAND}" style="border-radius:8px;">
             <a href="${safeUrl(button.url)}"
                style="display:inline-block;padding:13px 28px;font-size:16px;font-weight:600;
                       color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(button.label)}</a>
           </td>
         </tr>
       </table>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>JobFolder</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <!-- Preview text. Hidden in the body, read by the inbox list. The spacer
       stops Gmail appending the start of the real body to the preview. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}
    ${"&#8199;&#65279;&nbsp;".repeat(60)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
         style="background:${PAGE_BG};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
               style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;">

          <tr>
            <td align="left" style="padding:28px 32px 8px;">
              <a href="${safeUrl(SITE_URL)}" style="text-decoration:none;">
                <img src="${safeUrl(SITE_URL)}/jobfolder-logo.png" alt="JobFolder"
                     width="176" height="42"
                     style="display:block;width:176px;height:auto;border:0;">
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 32px 8px;">
              ${greeting ? p(greeting) : ""}
              ${paragraphs.map(p).join("")}
              ${fieldsBlock}
              ${quoteBlock}
              ${bulletsBlock}
              ${buttonBlock}
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:${LINE};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px 28px;">
              <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${MUTED};">
                ${escapeHtml(footerNote)}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:${MUTED};">
                <a href="${safeUrl(SITE_URL)}" style="color:${BRAND_DARK};text-decoration:none;">JobFolder</a>
                &nbsp;&middot;&nbsp; Specialist recruiting, matched to the desk that can fill it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  /* The plain-text half. Not a stripped-down afterthought: it's what a
     text-only client shows, and what a spam filter reads when it decides
     whether an HTML-only message is worth trusting. */
  const textParts: string[] = [];
  if (greeting) textParts.push(greeting);
  for (const s of paragraphs) textParts.push(s);
  if (fields.length) textParts.push(fields.map((f) => `${f.label}: ${f.value}`).join("\n"));
  if (quote) textParts.push(quote.split(/\r?\n/).map((l) => `> ${l}`).join("\n"));
  if (bullets.length) textParts.push(bullets.map((b) => `  - ${b}`).join("\n"));
  if (button) textParts.push(`${button.label}: ${button.url}`);
  textParts.push("---", footerNote, `JobFolder — ${SITE_URL}`);

  return { html, text: textParts.join("\n\n") };
}
