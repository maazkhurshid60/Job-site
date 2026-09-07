import { handle, ok, jsonBody, NotFound, BadRequest } from "@/lib/server/respond";
import { getMessage, setMessageHandled, setMessageSleeping } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function messageId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequest("That isn't a valid message id.");
  return id;
}

/** Admin: one enquiry with its whole thread, for the console's detail page.
    The list endpoint returns every enquiry, which is the wrong shape for a
    page about a single conversation — and gets worse as the inbox grows. */
export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const message = await getMessage(messageId(id));
    if (!message) throw new NotFound("That enquiry no longer exists.");
    return ok(message);
  });
}

/* Admin: change an enquiry's state.
 *
 * Two independent flags, and either may be sent on its own:
 *
 *   handled  — have we replied? (`Mark handled` / `Reopen`)
 *   sleeping — are we looking at this now? (`Sleep` / `Wake`)
 *
 * They're separate because a thread can honestly be both: answered, and
 * parked while we wait on someone else. Sleeping deletes nothing — the row,
 * its replies and the sender's own copy at /dashboard/enquiries all stay.
 */
export function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const numericId = messageId(id);

    const body = await jsonBody(req);
    const hasHandled = typeof body.handled === "boolean";
    const hasSleeping = typeof body.sleeping === "boolean";
    if (!hasHandled && !hasSleeping) {
      throw new BadRequest("Send `handled` and/or `sleeping` as true or false.");
    }

    /* Whichever flags were sent must all land on an existing row. Checked per
       update rather than once up front, so a row deleted mid-request is
       reported as gone instead of as a success. */
    if (hasHandled) {
      const updated = await setMessageHandled(numericId, body.handled as boolean);
      if (!updated) throw new NotFound("That enquiry no longer exists.");
    }
    if (hasSleeping) {
      const updated = await setMessageSleeping(numericId, body.sleeping as boolean);
      if (!updated) throw new NotFound("That enquiry no longer exists.");
    }

    return ok({
      ...(hasHandled ? { handled: body.handled } : {}),
      ...(hasSleeping ? { sleeping: body.sleeping } : {}),
    });
  });
}
