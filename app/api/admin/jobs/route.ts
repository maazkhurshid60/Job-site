import { handle, ok, jsonBody } from "@/lib/server/respond";
import { listAllJobs, createJob } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { readJobWrite } from "../jobWrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: every job, any status. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listAllJobs());
  });
}

/** Admin: post a new role. */
export function POST(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const id = await createJob(readJobWrite(await jsonBody(req)));
    return ok({ id }, { status: 201 });
  });
}
