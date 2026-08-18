import { handle, ok, NotFound } from "@/lib/server/respond";
import { cancelAdminInvite, logAdminAction } from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: cancel a pending invite before it's claimed. */
export function DELETE(
  req: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const { email } = await params;

    const removed = await cancelAdminInvite(email);
    if (!removed) throw new NotFound("No pending invite for that email.");

    await logAdminAction({
      action: "invite_cancelled",
      actorUid: actor.uid,
      actorName: actor.name,
      actorEmail: actor.email,
      targetUid: null,
      targetName: "",
      targetEmail: email,
    });
    return ok({ email });
  });
}
