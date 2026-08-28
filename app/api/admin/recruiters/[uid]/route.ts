import { handle, ok, jsonBody, BadRequest, NotFound } from "@/lib/server/respond";
import {
  setMetroTeamMember, setRecruiterVerified, setRecruiterSuspended, setSiteBuilderEnabled,
  getUserProfile, logAdminAction,
} from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: the fields the console can set on a recruiter — whether they
    appear on Metro Associates' public team page, whether they've been
    vetted, whether they're suspended, and whether the recruiter-website
    builder is unlocked for them. Everything else on a profile is the
    recruiter's own to fill in. All optional in the body so a caller only
    ever has to send the one it's toggling. */
export function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const { uid } = await params;
    const body = await jsonBody(req);

    if (
      body.metroTeamMember === undefined && body.verified === undefined &&
      body.suspended === undefined && body.siteBuilderEnabled === undefined
    ) {
      throw new BadRequest(
        "Nothing to update — send metroTeamMember, verified, suspended, and/or siteBuilderEnabled.",
      );
    }

    // Fetched once up front — every branch below needs it both to confirm
    // the recruiter exists and to log a readable target name/email.
    const recruiter = await getUserProfile(uid);
    if (!recruiter) throw new NotFound("Recruiter not found.");
    const target = { targetUid: uid, targetName: recruiter.name, targetEmail: recruiter.email };

    const result: {
      uid: string;
      metroTeamMember?: boolean;
      verified?: boolean;
      suspended?: boolean;
      siteBuilderEnabled?: boolean;
    } = { uid };

    if (body.metroTeamMember !== undefined) {
      if (typeof body.metroTeamMember !== "boolean") {
        throw new BadRequest("metroTeamMember must be a boolean.");
      }
      await setMetroTeamMember(uid, body.metroTeamMember);
      result.metroTeamMember = body.metroTeamMember;
    }

    if (body.verified !== undefined) {
      if (typeof body.verified !== "boolean") {
        throw new BadRequest("verified must be a boolean.");
      }
      await setRecruiterVerified(uid, body.verified);
      result.verified = body.verified;
      await logAdminAction({
        action: body.verified ? "recruiter_verified" : "recruiter_unverified",
        actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
        ...target,
      });
    }

    if (body.suspended !== undefined) {
      if (typeof body.suspended !== "boolean") {
        throw new BadRequest("suspended must be a boolean.");
      }
      await setRecruiterSuspended(uid, body.suspended);
      result.suspended = body.suspended;
      await logAdminAction({
        action: body.suspended ? "recruiter_suspended" : "recruiter_reinstated",
        actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
        ...target,
      });
    }

    if (body.siteBuilderEnabled !== undefined) {
      if (typeof body.siteBuilderEnabled !== "boolean") {
        throw new BadRequest("siteBuilderEnabled must be a boolean.");
      }
      await setSiteBuilderEnabled(uid, body.siteBuilderEnabled);
      result.siteBuilderEnabled = body.siteBuilderEnabled;
      await logAdminAction({
        action: body.siteBuilderEnabled ? "site_builder_unlocked" : "site_builder_locked",
        actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
        ...target,
      });
    }

    return ok(result);
  });
}
