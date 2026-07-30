import { handle, ok, jsonBody, str } from "@/lib/server/respond";
import { createMessage, listMessages } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: contact form. Mirrors the old rule — email and message required. */
export function POST(req: Request) {
  return handle(async () => {
    const body = await jsonBody(req);
    await createMessage({
      name: str(body.name, "name", { max: 255 }),
      email: str(body.email, "email", { max: 320, required: true }),
      subject: str(body.subject, "subject", { max: 255 }),
      message: str(body.message, "message", { required: true }),
    });
    // No echo of the stored row: nothing here is useful to the sender.
    return ok({ sent: true }, { status: 201 });
  });
}

/** Admin: read enquiries. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listMessages());
  });
}
