import { apiFetch } from "./api";

/* Messages shown inside a recruiter's dashboard. Sent by an admin today;
   the `source` field leaves room for system-generated alerts later without
   a schema change. */

export type Notification = {
  id: number;
  title: string;
  body: string;
  /** Relative in-app path, or "" for none. */
  link: string;
  source: string;
  authorName: string;
  read: boolean;
  createdAt: string | null;
};

export type NotificationFeed = { items: Notification[]; unread: number };

export function listMyNotifications(): Promise<NotificationFeed> {
  return apiFetch<NotificationFeed>("/api/me/notifications", { auth: true });
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiFetch(`/api/me/notifications/${id}`, { method: "PATCH", auth: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/me/notifications", { method: "POST", auth: true });
}
