import { handle, ok } from "@/lib/server/respond";
import { listOpenJobs } from "@/lib/server/repo";

/* mysql2 needs the Node runtime — it cannot run on edge. Every route in this
   API declares it explicitly rather than relying on the default. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: the job board. Only `open` roles, newest first. */
export function GET() {
  return handle(async () => ok(await listOpenJobs()));
}
