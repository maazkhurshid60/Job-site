import { handle, ok, BadRequest, NotFound } from "@/lib/server/respond";
import { countAdmins, listAdmins, removeAdmin, logAdminAction } from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: revoke another account's admin access — or your own. Refuses to
    remove the last remaining admin: bootstrap (POST /api/admin/bootstrap)
    only runs while the admins table is empty, so letting the count reach
    zero wouldn't just lock everyone out, it would reopen bootstrap and let
    the next signed-in visitor claim admin for themselves. */
export function DELETE(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const { uid } = await params;

    if ((await countAdmins()) <= 1) {
      throw new BadRequest(
        "Can't remove the last admin — the console would lock everyone out.",
      );
    }

    const admins = await listAdmins();
    const target = admins.find((a) => a.uid === uid);

    const removed = await removeAdmin(uid);
    if (!removed) throw new NotFound("That account isn't an admin.");

    await logAdminAction({
      action: "revoke",
      actorUid: actor.uid,
      actorName: actor.name,
      actorEmail: actor.email,
      targetUid: uid,
      targetName: target?.name ?? "",
      targetEmail: target?.email ?? "",
    });
    return ok({ uid });
  });
}
