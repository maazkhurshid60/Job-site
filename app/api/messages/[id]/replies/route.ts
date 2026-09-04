import { handle, ok, jsonBody, str, BadRequest, NotFound } from "@/lib/server/respond";
import { addMessageReply, getMessageRecipient } from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";
import { notifyEnquiryReply } from "@/lib/server/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Admin: answer a contact-form enquiry from inside JobFolder.
 *
 * "Reply" used to be a mailto: link, which meant the answer went from
 * whichever mail client that admin happened to have, and left no trace here
 * — a second admin couldn't tell whether a lead had been answered or what
 * was said, and a recruiter who wrote in had nowhere to read the response.
 *
 * The reply is stored first and emailed second, so the record survives a
 * send failure. Storing it also marks the enquiry handled: replying IS
 * handling it, and leaving that to a separate click is how threads end up
 * answered twice.
 */
export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const { id } = await params;
    const messageId = Number(id);
    if (!Number.isInteger(messageId) || messageId <= 0) {
      throw new BadRequest("That isn't a valid enquiry id.");
    }

    const body = await jsonBody(req);
    const text = str(body.body, "body", { required: true, max: 20000 });

    const recipient = await getMessageRecipient(messageId);
    if (!recipient) throw new NotFound("That enquiry no longer exists.");

    await addMessageReply({
      messageId,
      adminUid: actor.uid,
      adminName: actor.name,
      adminEmail: actor.email,
      body: text,
    });

    /* Best-effort, and after the write: an email failure must not lose the
       reply. It's on the thread either way, and the sender can see it on
       their dashboard if they have an account. */
    let emailed = true;
    try {
      await notifyEnquiryReply({
        toName: recipient.name,
        toEmail: recipient.email,
        subject: recipient.subject,
        body: text,
        fromName: actor.name,
      });
    } catch (err) {
      console.error("[enquiry-reply] notification email failed:", err);
      emailed = false;
    }

    // Reported rather than swallowed, so the console can say the reply was
    // saved but not delivered instead of implying it reached them.
    return ok({ sent: true, emailed }, { status: 201 });
  });
}
