import { handle, ok, jsonBody, str } from "@/lib/server/respond";
import {
  listAdmins, listAdminInvites, createAdmin, createAdminInvite,
  getUserByEmail, logAdminAction,
} from "@/lib/server/repo";
import { requireAdmin, requireAdminIdentity } from "@/lib/server/auth";
import type { AdminAccessGrant } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: the console's admin allow-list, plus any pending invites. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const [admins, invites] = await Promise.all([listAdmins(), listAdminInvites()]);
    return ok({ admins, invites });
  });
}

/** Admin: grant admin access to whoever holds this email. If the account
    already exists, access is granted immediately. Otherwise this creates an
    invite rather than failing — it auto-activates the moment that email
    signs in (see claimAdminInvite, called from GET /api/me). Either way the
    action is logged to the audit trail. */
export function POST(req: Request) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const body = await jsonBody(req);
    // Exact match, but the email column's collation (utf8mb4_0900_ai_ci) is
    // itself case-insensitive, so this doesn't need a .toLowerCase() here.
    const email = str(body.email, "email", { max: 320, required: true });

    const account = await getUserByEmail(email);

    if (!account) {
      await createAdminInvite(email, actor.name, actor.email);
      await logAdminAction({
        action: "invite",
        actorUid: actor.uid,
        actorName: actor.name,
        actorEmail: actor.email,
        targetUid: null,
        targetName: "",
        targetEmail: email,
      });
      const invites = await listAdminInvites();
      const invite = invites.find((i) => i.email === email) ?? {
        email, invitedByName: actor.name, invitedByEmail: actor.email, createdAt: null,
      };
      const result: AdminAccessGrant = { kind: "invite", invite };
      return ok(result, { status: 201 });
    }

    await createAdmin(account.uid);
    await logAdminAction({
      action: "grant",
      actorUid: actor.uid,
      actorName: actor.name,
      actorEmail: actor.email,
      targetUid: account.uid,
      targetName: account.name,
      targetEmail: account.email,
    });
    const admins = await listAdmins();
    const admin = admins.find((a) => a.uid === account.uid) ?? {
      uid: account.uid, note: "", name: account.name, email: account.email,
      createdAt: null, lastActiveAt: null,
    };
    const result: AdminAccessGrant = { kind: "admin", admin };
    return ok(result, { status: 201 });
  });
}
