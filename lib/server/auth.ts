import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { queryOne } from "@/lib/db";

/* Server-side verification of Firebase Auth ID tokens.

   This replaces what firestore.rules used to do. Every rule that read
   `request.auth.uid` is now an explicit check in an API route, and every rule
   that called isAdmin() is now requireAdmin().

   Why jose and not firebase-admin: Firebase ID tokens are ordinary RS256 JWTs
   signed by Google, and verifying one only needs Google's public keys. The
   Admin SDK would additionally need a service-account private key deployed as
   a secret — a much larger blast radius than we need for "who is this caller".
   The JWKS is fetched once and cached by createRemoteJWKSet. */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/* Google publishes the signing keys for Firebase ID tokens here. Note this is
   the securetoken endpoint — ID tokens are NOT signed with the same keys as
   the generic Google OAuth JWKS. */
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
  }
}

/** Pull the bearer token out of the Authorization header. */
function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/* Who the caller is, straight from the verified token. `email` and `name` are
   Firebase Auth's own record of the account — they are signed by Google, so
   unlike anything in a request body they can be trusted to create a row with.
   `name` is empty when the account has no displayName. `emailVerified` is
   Firebase's own `email_verified` claim, present on every ID token. */
export type Identity = {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

/**
 * Verify the caller's ID token and return their identity.
 * Returns null when no token was sent — callers decide whether that's allowed.
 * Throws AuthError(401) when a token was sent but is not valid.
 */
export async function getIdentity(req: Request): Promise<Identity | null> {
  const token = bearerToken(req);
  if (!token) return null;

  if (!PROJECT_ID) {
    // Misconfiguration, not a client error — never fall through to "anonymous",
    // which would silently make protected routes public.
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.");
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      // Both are mandatory: without them a valid Google-signed token issued for
      // any other Firebase project would be accepted here.
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });

    // `sub` is the Firebase UID. jose has already rejected expired tokens.
    const uid = typeof payload.sub === "string" ? payload.sub : null;
    if (!uid) throw new AuthError("Token has no subject.", 401);
    return {
      uid,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
      emailVerified: payload.email_verified === true,
    };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Invalid or expired token.", 401);
  }
}

/** The caller's UID, or null when signed out. */
export async function getUid(req: Request): Promise<string | null> {
  return (await getIdentity(req))?.uid ?? null;
}

/** Require a signed-in user. Throws AuthError(401) otherwise. */
export async function requireUid(req: Request): Promise<string> {
  return (await requireIdentity(req)).uid;
}

/** Require a signed-in user and return their full identity. */
export async function requireIdentity(req: Request): Promise<Identity> {
  const identity = await getIdentity(req);
  if (!identity) throw new AuthError("Sign in required.", 401);
  return identity;
}

/* True when the recruiter's own `users` row has been suspended by an admin.
   False (not suspended) for a uid with no row yet — nothing to suspend
   mid-signup. Deliberately NOT folded into requireUid: that function also
   backs requireAdmin below, and a suspended recruiter profile must never be
   able to lock an admin account out of the console. */
async function isSuspended(uid: string): Promise<boolean> {
  const row = await queryOne<{ suspended: number }>(
    "SELECT suspended FROM users WHERE uid = ?",
    [uid],
  );
  return row !== null && Boolean(row.suspended);
}

/* Require a signed-in user with a verified email. This is the actual
   enforcement point for "recruiters must verify their email" — the dashboard
   UI gate is only presentation, and a request straight to a protected
   endpoint has to be refused here or the rule doesn't exist. Throws 403
   (not 401): the caller IS authenticated, they just haven't cleared this
   extra bar yet, which is a different condition than not being signed in.
   Also refuses a suspended account — see isSuspended() above. */
export async function requireVerifiedUid(req: Request): Promise<string> {
  const identity = await requireIdentity(req);
  if (!identity.emailVerified) {
    throw new AuthError("Please verify your email before continuing.", 403);
  }
  if (await isSuspended(identity.uid)) {
    throw new AuthError("Your account has been suspended.", 403);
  }
  return identity.uid;
}

/** Require a signed-in, non-suspended recruiter. Use this (not requireUid)
    for anything a suspended account shouldn't be able to do: create/edit
    saved candidates, send a submission message, upload a file. Not used by
    requireAdmin — see isSuspended() above for why. */
export async function requireActiveUid(req: Request): Promise<string> {
  const uid = await requireUid(req);
  if (await isSuspended(uid)) {
    throw new AuthError("Your account has been suspended.", 403);
  }
  return uid;
}

/** True when the UID is in the admins table — the old isAdmin() rule. */
export async function isAdmin(uid: string): Promise<boolean> {
  const row = await queryOne<{ uid: string }>(
    "SELECT uid FROM admins WHERE uid = ? LIMIT 1",
    [uid],
  );
  return row !== null;
}

/** Require an admin. Throws 401 if signed out, 403 if signed in but not admin. */
export async function requireAdmin(req: Request): Promise<string> {
  const uid = await requireUid(req);
  if (!(await isAdmin(uid))) {
    throw new AuthError("Admin access required.", 403);
  }
  return uid;
}

/** Same as requireAdmin, but returns the full identity — for routes that need
    the caller's name/email to write an audit trail, not just their uid. */
export async function requireAdminIdentity(req: Request): Promise<Identity> {
  const identity = await requireIdentity(req);
  if (!(await isAdmin(identity.uid))) {
    throw new AuthError("Admin access required.", 403);
  }
  return identity;
}
