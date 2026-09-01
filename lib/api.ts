import { auth } from "./firebase";

/* Browser-side client for our own API.

   Every authenticated call attaches the caller's Firebase ID token. The server
   verifies it and derives the UID from the token — the UID is never sent in a
   body or query string, because a client-supplied identity is not an identity.

   getIdToken() refreshes automatically when the cached token is near expiry,
   so this is safe to call on every request. */

async function authHeader(required: boolean): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    if (required) throw new Error("You need to be signed in to do that.");
    return {};
  }
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** true = throw if signed out; false = send the token only if we have one. */
  auth?: boolean | "optional";
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth: authMode = false }: Options = {},
): Promise<T> {
  const headers: HeadersInit = {
    ...(await authHeader(authMode === true)),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Our own API is never cacheable — it's all per-user or live data.
    cache: "no-store",
  });

  if (!res.ok) {
    // Surface the server's message when it gave one; it is written to be shown.
    let message = `Request failed (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* Upload a file to POST /api/files, which stores the bytes in MySQL.

   Sent as multipart/form-data with no Content-Type header of our own — the
   browser must set it, because only it knows the multipart boundary.

   Requires a signed-in user; the server records them as the uploader. */
export async function uploadFile(
  file: File,
  kind: "cv" | "avatar" | "video",
): Promise<{ id: string; filename: string; size: number; url?: string }> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);

  const res = await fetch("/api/files", {
    method: "POST",
    // Both kinds require a signed-in user; throw before uploading if not.
    headers: await authHeader(true),
    body: form,
  });

  if (!res.ok) {
    let message = `Upload failed (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* Vercel rejects bodies over ~4.5 MB before the route runs, and answers
         with a non-JSON 413. Say something useful rather than "Upload failed". */
      if (res.status === 413) {
        message = "That file is too large to upload. Please use a smaller file.";
      }
    }
    throw new Error(message);
  }

  return res.json();
}
