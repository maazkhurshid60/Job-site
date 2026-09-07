import { apiFetch } from "./api";

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  recaptchaToken: string | null;
};

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  /** Parked by an admin: out of both working lists, nothing deleted. Wakes
      by itself when the sender replies. */
  sleeping: boolean;
  /** Set when a signed-in user sent it; null for an anonymous visitor. */
  senderUid: string | null;
  /** Our answers, oldest first. */
  replies: EnquiryReply[];
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
};

export type EnquiryReply = {
  id: number;
  /** An admin's name outbound; the enquirer's inbound. */
  adminName: string;
  body: string;
  /** "out" = we sent it. "in" = they replied by email. */
  direction: "out" | "in";
  createdAt: string | null;
};

/* Public: anyone can send an enquiry. Admins read these in the console. */
export async function sendMessage(input: ContactInput): Promise<void> {
  await apiFetch("/api/messages", { method: "POST", body: input, auth: "optional" });
}

/** Admin: read contact enquiries. */
export function listMessages(): Promise<ContactMessage[]> {
  return apiFetch<ContactMessage[]>("/api/messages", { auth: true });
}

/** Admin: read one enquiry and its whole thread. */
export function getMessage(id: number): Promise<ContactMessage> {
  return apiFetch<ContactMessage>(`/api/messages/${id}`, { auth: true });
}

/** Admin: tick an enquiry off as dealt with, or put it back in the pile. */
export async function setMessageHandled(id: number, handled: boolean): Promise<void> {
  await apiFetch(`/api/messages/${id}`, { method: "PATCH", body: { handled }, auth: true });
}

/** Admin: park an enquiry, or bring it back. Nothing is deleted — the thread
    and the sender's own copy of it are untouched. */
export async function setMessageSleeping(id: number, sleeping: boolean): Promise<void> {
  await apiFetch(`/api/messages/${id}`, { method: "PATCH", body: { sleeping }, auth: true });
}

/** Admin: answer an enquiry from inside JobFolder. Also marks it handled.
    `emailed` is false when the reply saved but the email didn't send — the
    console says so rather than implying it reached them. */
export function replyToMessage(id: number, body: string): Promise<{ sent: boolean; emailed: boolean }> {
  return apiFetch<{ sent: boolean; emailed: boolean }>(`/api/messages/${id}/replies`, {
    method: "POST",
    body: { body },
    auth: true,
  });
}

/** The signed-in user's own enquiries to JobFolder, with our replies. */
export function listMyEnquiries(): Promise<ContactMessage[]> {
  return apiFetch<ContactMessage[]>("/api/me/enquiries", { auth: true });
}
