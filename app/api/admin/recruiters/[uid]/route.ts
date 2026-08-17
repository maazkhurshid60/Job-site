import { handle, ok, jsonBody, BadRequest, NotFound } from "@/lib/server/respond";
import { setMetroTeamMember } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: toggle whether a recruiter appears on Metro Associates' public
    team page. The only editable field on a recruiter from the console —
    everything else is theirs to fill in from their own profile. */
export function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { uid } = await params;
    const body = await jsonBody(req);
    if (typeof body.metroTeamMember !== "boolean") {
      throw new BadRequest("metroTeamMember must be a boolean.");
    }
    const updated = await setMetroTeamMember(uid, body.metroTeamMember);
    if (!updated) throw new NotFound("Recruiter not found.");
    return ok({ uid, metroTeamMember: body.metroTeamMember });
  });
}
