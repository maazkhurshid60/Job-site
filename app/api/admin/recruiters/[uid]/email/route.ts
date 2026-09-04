import { handle, ok, jsonBody, str, bool, NotFound, BadRequest } from "@/lib/server/respond";
import { getUserProfile, logAdminAction, createNotification } from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";
import { notifyAdminMessage } from "@/lib/server/notify";
import { adminEmailTemplate, fillTemplate } from "@/lib/adminEmailTemplates";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Admin: email one recruiter from the console, on the JobFolder letterhead
 * and from the verified jobfolder.com sender.
 *
 * The recipient is looked up from the uid in the URL — the request never
 * supplies an address. That keeps this from being a general-purpose mailer:
 * it can only ever reach someone who already has an account here.
 *
 * The template only supplies a starting subject and body; the admin edits
 * both before sending, and what arrives is what they saw. The only thing
 * they can't edit is the button, whose destination stays a fixed path
 * inside the recruiter's own dashboard.
 */
export function POST(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const { uid } = await params;

    const profile = await getUserProfile(uid);
    if (!profile) throw new NotFound("Recruiter not found.");
    if (!profile.email) throw new BadRequest("This recruiter has no email address on file.");

    const body = await jsonBody(req);
    const subject = str(body.subject, "subject", { required: true, max: 255 });
    const message = str(body.body, "body", { required: true, max: 20000 });

    /* Two channels, one action. Email leaves the product — it can bounce, go
       to spam, or be deleted, and nobody can tell afterwards whether it was
       read. A dashboard notification sits where the recruiter already signs
       in and records when they opened it. Default both on: an admin writing
       a message wants it seen, not delivered to exactly one place. */
    const sendEmail = body.email === undefined ? true : bool(body.email);
    const sendNotification = body.notify === undefined ? true : bool(body.notify);
    if (!sendEmail && !sendNotification) {
      throw new BadRequest("Choose at least one of email or dashboard notification.");
    }

    // Unknown ids are ignored rather than rejected: the CTA is the only thing
    // the template still controls at this point, and a missing one is not a
    // reason to refuse an email the admin has already written.
    const template = adminEmailTemplate(str(body.templateId, "templateId", { max: 64 }));

    /* The notification is written first. It's the durable half — if Brevo is
       down, the recruiter still gets the message where they'll see it, and
       the admin is told the email didn't go rather than being left to guess. */
    if (sendNotification) {
      await createNotification({
        recipientUid: uid,
        title: fillTemplate(subject, profile.name),
        body: fillTemplate(message, profile.name),
        link: template?.cta?.path ?? "",
        source: "admin",
        authorName: actor.name,
      });
    }

    let emailed = false;
    if (sendEmail) {
      try {
        await notifyAdminMessage({
          toName: profile.name,
          toEmail: profile.email,
          subject: fillTemplate(subject, profile.name),
          body: fillTemplate(message, profile.name),
          ...(template?.cta
            ? { button: { label: template.cta.label, url: `${SITE_URL}${template.cta.path}` } }
            : {}),
        });
        emailed = true;
      } catch (err) {
        console.error("[recruiter-email] send failed:", err);
        // Only fatal when email was the only channel asked for — otherwise
        // the message did reach them, and saying nothing went out is a lie.
        if (!sendNotification) throw err;
      }
    }

    await logAdminAction({
      action: "email_sent",
      actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
      targetUid: uid, targetName: profile.name, targetEmail: profile.email,
      details: `${subject} (${[sendEmail ? (emailed ? "emailed" : "email failed") : null, sendNotification ? "dashboard" : null].filter(Boolean).join(", ")})`,
    });

    return ok({ sent: true, emailed, notified: sendNotification });
  });
}
