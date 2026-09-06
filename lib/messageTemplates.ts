import { apiFetch } from "./api";
import type { CustomTemplate } from "./adminEmailTemplates";

/* Templates an admin writes in the console, on top of the built-in set in
   lib/adminEmailTemplates.ts. Stored as one JSON blob in `settings`, so the
   editor reads and writes the whole list at once. */

export function listCustomTemplates(): Promise<CustomTemplate[]> {
  return apiFetch<CustomTemplate[]>("/api/admin/message-templates", { auth: true });
}

export async function saveCustomTemplates(templates: CustomTemplate[]): Promise<void> {
  await apiFetch("/api/admin/message-templates", {
    method: "PUT",
    body: { templates },
    auth: true,
  });
}

/* Ids are generated here rather than server-side so an unsaved template can
   be edited and reordered in the browser before it ever reaches the API.
   Prefixed to make it obvious in the stored JSON which ones are admin-made,
   and to keep them clear of the built-in ids. */
export function newTemplateId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
