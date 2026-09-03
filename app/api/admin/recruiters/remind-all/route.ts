import { handle, ok } from "@/lib/server/respond";
import { listUsers, markProfileReminderSent, logAdminAction } from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";
import { notifyProfileReminder } from "@/lib/server/notify";
import { profileCompletion } from "@/lib/profileCompletion";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* Sends are sequential-ish and each waits on Brevo, so give this more than
   the 10s default. The deadline guard below stops well inside it. */
export const maxDuration = 60;

/* Don't email the same person twice in a week. This is a single button that
   mails everyone, so a double-click, a retry after a flaky response, or two
   admins reaching for it the same morning would otherwise land as repeat
   nagging in a recruiter's inbox — the fastest way to get marked as spam on
   a domain with no sending history. Per-recruiter reminders from the detail
   page deliberately ignore this: that's a deliberate one-off, not a sweep. */
const COOLDOWN_DAYS = 7;

/* Brevo is fine with this rate and it keeps us inside maxDuration for a few
   hundred recruiters. Beyond that the deadline guard takes over and reports
   what's left rather than dying mid-sweep. */
const CONCURRENCY = 4;
const DEADLINE_MS = 45_000;

type Skip = "complete" | "suspended" | "recent" | "no-email";

/** Admin: email every recruiter who still has an unfinished profile.
    Returns a per-reason breakdown rather than a bare count — "sent 3" is
    alarming until you can see that 17 were skipped for good reasons. */
export function POST(req: Request) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const startedAt = Date.now();

    const users = await listUsers();
    const cutoff = Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

    const skipped: Record<Skip, number> = { complete: 0, suspended: 0, recent: 0, "no-email": 0 };
    const queue: { uid: string; name: string; email: string; missing: string[] }[] = [];

    for (const u of users) {
      if (!u.email) { skipped["no-email"]++; continue; }
      // A suspended account can't act on the reminder, so chasing them is
      // noise at best and confusing at worst.
      if (u.suspended) { skipped.suspended++; continue; }

      const completion = profileCompletion(u);
      if (completion.isComplete) { skipped.complete++; continue; }

      const last = u.profileReminderSentAt ? new Date(u.profileReminderSentAt).getTime() : 0;
      if (last > cutoff) { skipped.recent++; continue; }

      queue.push({
        uid: u.uid,
        name: u.name,
        email: u.email,
        missing: completion.missing.map((f) => f.label),
      });
    }

    const sentTo: string[] = [];
    const failed: { name: string; email: string }[] = [];
    let stoppedEarly = false;
    let cursor = 0;

    async function worker() {
      while (cursor < queue.length) {
        if (Date.now() - startedAt > DEADLINE_MS) { stoppedEarly = true; return; }
        const item = queue[cursor++];
        try {
          await notifyProfileReminder({
            name: item.name,
            email: item.email,
            missingLabels: item.missing,
            profileUrl: `${SITE_URL}/dashboard/profile`,
          });
          // Only stamped after Brevo accepts it, so a failure stays eligible
          // for the next sweep instead of being silently skipped for a week.
          await markProfileReminderSent(item.uid);
          sentTo.push(item.name || item.email);
        } catch {
          failed.push({ name: item.name, email: item.email });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

    /* One audit entry, not one per recipient: twenty rows per click would
       bury every other admin action in the log. The names go in `details`. */
    if (sentTo.length > 0 || failed.length > 0) {
      await logAdminAction({
        action: "profile_reminder_sent",
        actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
        targetUid: null,
        targetName: `${sentTo.length} recruiter${sentTo.length === 1 ? "" : "s"}`,
        targetEmail: "",
        details:
          `Bulk reminder. Sent to: ${sentTo.join(", ") || "(none)"}.` +
          ` Skipped ${skipped.complete} complete, ${skipped.suspended} suspended, ${skipped.recent} reminded in the last ${COOLDOWN_DAYS} days.` +
          (failed.length ? ` Failed: ${failed.map((f) => f.email).join(", ")}.` : ""),
      });
    }

    return ok({
      sent: sentTo.length,
      sentTo,
      failed: failed.length,
      skippedComplete: skipped.complete,
      skippedSuspended: skipped.suspended,
      skippedRecent: skipped.recent,
      remaining: stoppedEarly ? queue.length - cursor : 0,
      cooldownDays: COOLDOWN_DAYS,
    });
  });
}
