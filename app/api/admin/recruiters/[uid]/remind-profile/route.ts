import { handle, ok, BadRequest, NotFound } from "@/lib/server/respond";
import { getUserProfile, markProfileReminderSent } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { notifyProfileReminder } from "@/lib/server/notify";
import { profileCompletion } from "@/lib/profileCompletion";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: email a recruiter a reminder to finish their profile. Refuses a
    profile that's already complete — there's nothing to remind them of, and
    it would just be a confusing email to receive. */
export function POST(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { uid } = await params;

    const profile = await getUserProfile(uid);
    if (!profile) throw new NotFound("Recruiter not found.");

    const completion = profileCompletion(profile);
    if (completion.isComplete) {
      throw new BadRequest("This recruiter's profile is already complete.");
    }

    await notifyProfileReminder({
      name: profile.name,
      email: profile.email,
      missingLabels: completion.missing.map((f) => f.label),
      profileUrl: `${SITE_URL}/dashboard/profile`,
    });

    await markProfileReminderSent(uid);

    return ok({ sent: true });
  });
}
