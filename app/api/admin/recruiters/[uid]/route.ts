import { handle, ok, jsonBody, BadRequest, NotFound } from "@/lib/server/respond";
import { setMetroTeamMember, setRecruiterVerified, setRecruiterSuspended } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: the fields the console can set on a recruiter — whether they
    appear on Metro Associates' public team page, whether they've been
    vetted, and whether they're suspended. Everything else on a profile is
    the recruiter's own to fill in. All optional in the body so a caller
    only ever has to send the one it's toggling. */
export function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { uid } = await params;
    const body = await jsonBody(req);

    if (body.metroTeamMember === undefined && body.verified === undefined && body.suspended === undefined) {
      throw new BadRequest("Nothing to update — send metroTeamMember, verified, and/or suspended.");
    }

    const result: { uid: string; metroTeamMember?: boolean; verified?: boolean; suspended?: boolean } = { uid };

    if (body.metroTeamMember !== undefined) {
      if (typeof body.metroTeamMember !== "boolean") {
        throw new BadRequest("metroTeamMember must be a boolean.");
      }
      const updated = await setMetroTeamMember(uid, body.metroTeamMember);
      if (!updated) throw new NotFound("Recruiter not found.");
      result.metroTeamMember = body.metroTeamMember;
    }

    if (body.verified !== undefined) {
      if (typeof body.verified !== "boolean") {
        throw new BadRequest("verified must be a boolean.");
      }
      const updated = await setRecruiterVerified(uid, body.verified);
      if (!updated) throw new NotFound("Recruiter not found.");
      result.verified = body.verified;
    }

    if (body.suspended !== undefined) {
      if (typeof body.suspended !== "boolean") {
        throw new BadRequest("suspended must be a boolean.");
      }
      const updated = await setRecruiterSuspended(uid, body.suspended);
      if (!updated) throw new NotFound("Recruiter not found.");
      result.suspended = body.suspended;
    }

    return ok(result);
  });
}
