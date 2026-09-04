import { handle, ok } from "@/lib/server/respond";
import { listNotifications, countUnreadNotifications, markAllNotificationsRead } from "@/lib/server/repo";
import { requireUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in recruiter's notifications, newest first, plus the unread
    count so the sidebar badge needs no second request. Scoped by uid inside
    the query — no request parameter can be changed to read someone else's. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    const [items, unread] = await Promise.all([
      listNotifications(uid),
      countUnreadNotifications(uid),
    ]);
    return ok({ items, unread });
  });
}

/** Mark every one of the caller's notifications read. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    return ok({ marked: await markAllNotificationsRead(uid) });
  });
}
