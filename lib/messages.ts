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
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
};

/* Public: anyone can send an enquiry. Admins read these in the console. */
export async function sendMessage(input: ContactInput): Promise<void> {
  await apiFetch("/api/messages", { method: "POST", body: input });
}

/** Admin: read contact enquiries. */
export function listMessages(): Promise<ContactMessage[]> {
  return apiFetch<ContactMessage[]>("/api/messages", { auth: true });
}

/** Admin: tick an enquiry off as dealt with, or put it back in the pile. */
export async function setMessageHandled(id: number, handled: boolean): Promise<void> {
  await apiFetch(`/api/messages/${id}`, { method: "PATCH", body: { handled }, auth: true });
}
