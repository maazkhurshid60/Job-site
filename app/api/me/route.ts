import { handle, ok, jsonBody, str } from "@/lib/server/respond";
import {
  getUserProfile, createUserProfile, ensureUserProfile, updateUserProfile,
} from "@/lib/server/repo";
import { requireUid, requireIdentity, isAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* A recruiter always gets a usable name. Firebase only carries `name` when the
   account has a displayName, and an empty one leaves the dashboard greeting
   and every submission credited to a blank. The email local part is a poor
   name but a real one, and the profile page invites them to correct it. */
function displayName(name: string, email: string): string {
  return name.trim() || email.split("@")[0] || "Recruiter";
}

/** The caller's own profile, plus whether they're an admin.
 *
 *  Signing in is what makes you a recruiter here: if a signed-in account has no
 *  profile row yet, this creates one from the verified token rather than
 *  handing back null. `profile` is therefore null only for an admin-only
 *  account, which deliberately stays out of the recruiter table. */
export function GET(req: Request) {
  return handle(async () => {
    const { uid, email, name } = await requireIdentity(req);
    const [existing, admin] = await Promise.all([
      getUserProfile(uid),
      isAdmin(uid),
    ]);

    const profile =
      existing ?? (admin ? null : await ensureUserProfile(uid, displayName(name, email), email));

    return ok({ profile, isAdmin: admin });
  });
}

/** Create the caller's profile at signup. uid comes from the token. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    const body = await jsonBody(req);
    await createUserProfile(
      uid,
      str(body.name, "name", { max: 255, required: true }),
      str(body.email, "email", { max: 320, required: true }),
    );
    return ok(await getUserProfile(uid), { status: 201 });
  });
}

/** Update the caller's own profile. Cannot touch uid, email or created_at. */
export function PUT(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    const body = await jsonBody(req);
    await updateUserProfile(uid, {
      name: str(body.name, "name", { max: 255 }),
      phone: str(body.phone, "phone", { max: 64 }),
      company: str(body.company, "company", { max: 255 }),
      headline: str(body.headline, "headline", { max: 255 }),
      location: str(body.location, "location", { max: 255 }),
      linkedin: str(body.linkedin, "linkedin", { max: 512 }),
      bio: str(body.bio, "bio"),
      photoURL: str(body.photoURL, "photoURL", { max: 1024 }),
    });
    return ok(await getUserProfile(uid));
  });
}
