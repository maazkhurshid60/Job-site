import { handle, ok } from "@/lib/server/respond";
import { listMessagesFromSender } from "@/lib/server/repo";
import { requireUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Enquiries the signed-in user has sent us through the contact form, with
    our answers. Scoped by uid inside the query, so there is no request
    parameter that could be changed to read someone else's thread. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    return ok(await listMessagesFromSender(uid));
  });
}
