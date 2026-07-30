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
