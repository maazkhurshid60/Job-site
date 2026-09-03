import { handle, ok, jsonBody, NotFound, BadRequest } from "@/lib/server/respond";
import { setMessageHandled } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: tick an enquiry off, or put it back in the pile. The `handled`
    column has existed since the table was created but nothing ever wrote to
    it — without this, a shared inbox has no way to show that someone has
    already replied, and two admins answer the same person. */
export function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequest("That isn't a valid message id.");
    }

    const body = await jsonBody(req);
    if (typeof body.handled !== "boolean") {
      throw new BadRequest("`handled` must be true or false.");
    }

    const updated = await setMessageHandled(numericId, body.handled);
    if (!updated) throw new NotFound("That enquiry no longer exists.");

    return ok({ handled: body.handled });
  });
}
