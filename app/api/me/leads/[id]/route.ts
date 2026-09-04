import { handle, ok, jsonBody, BadRequest, NotFound } from "@/lib/server/respond";
import { setSiteLeadHandled } from "@/lib/server/repo";
import { requireUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A recruiter ticking off one of their own leads. The uid is passed into
    the UPDATE's WHERE clause, so touching someone else's lead matches no row
    and 404s — ownership is enforced in SQL, not by a check that could be
    skipped. */
export function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const uid = await requireUid(req);
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequest("That isn't a valid lead id.");
    }

    const body = await jsonBody(req);
    if (typeof body.handled !== "boolean") {
      throw new BadRequest("`handled` must be true or false.");
    }

    if (!(await setSiteLeadHandled(numericId, body.handled, uid))) {
      throw new NotFound("That lead no longer exists.");
    }
    return ok({ handled: body.handled });
  });
}
