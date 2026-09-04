import { handle, ok, jsonBody, str, NotFound, BadRequest } from "@/lib/server/respond";
import { getUserProfile, logAdminAction } from "@/lib/server/repo";
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

    // Unknown ids are ignored rather than rejected: the CTA is the only thing
    // the template still controls at this point, and a missing one is not a
    // reason to refuse an email the admin has already written.
    const template = adminEmailTemplate(str(body.templateId, "templateId", { max: 64 }));

    await notifyAdminMessage({
      toName: profile.name,
      toEmail: profile.email,
      subject: fillTemplate(subject, profile.name),
      body: fillTemplate(message, profile.name),
      ...(template?.cta
        ? { button: { label: template.cta.label, url: `${SITE_URL}${template.cta.path}` } }
        : {}),
    });

    await logAdminAction({
      action: "email_sent",
      actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
      targetUid: uid, targetName: profile.name, targetEmail: profile.email,
      details: subject,
    });

    return ok({ sent: true });
  });
}
