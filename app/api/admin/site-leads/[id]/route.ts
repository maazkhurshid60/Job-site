import { handle, ok, jsonBody, BadRequest, NotFound } from "@/lib/server/respond";
import { setSiteLeadHandled } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: tick a recruiter's site lead off, or put it back. Passing null as
    the owner lets an admin update any lead — the recruiter-facing route at
    /api/me/leads/[id] scopes the same write to its owner instead. */
export function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequest("That isn't a valid lead id.");
    }

    const body = await jsonBody(req);
    if (typeof body.handled !== "boolean") {
      throw new BadRequest("`handled` must be true or false.");
    }

    if (!(await setSiteLeadHandled(numericId, body.handled, null))) {
      throw new NotFound("That lead no longer exists.");
    }
    return ok({ handled: body.handled });
  });
}
