import { handle, ok } from "@/lib/server/respond";
import { countAdmins, createAdmin } from "@/lib/server/repo";
import { requireUid, AuthError } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* First-admin bootstrap, used by the /setup page.

   The Firestore rule this replaces let ANY signed-in user create
   admins/{their-uid}, and relied on someone remembering to change the rule back
   to `if false` afterwards. If they forgot, every user who ever signed up could
   promote themselves.

   This closes on its own: once one admin exists, the endpoint refuses. There is
   no manual step to forget. */

/** Whether bootstrap is still possible — lets /setup show the right state. */
export function GET() {
  return handle(async () => ok({ available: (await countAdmins()) === 0 }));
}

/** Promote the caller to admin, but only while no admin exists. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);

    if ((await countAdmins()) > 0) {
      throw new AuthError("An admin already exists. Bootstrap is closed.", 403);
    }

    await createAdmin(uid, "bootstrap");
    return ok({ uid, isAdmin: true }, { status: 201 });
  });
}
