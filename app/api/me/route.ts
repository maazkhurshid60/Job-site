import { handle, ok, jsonBody, str } from "@/lib/server/respond";
import {
  getUserProfile, createUserProfile, updateUserProfile,
} from "@/lib/server/repo";
import { requireUid, isAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The caller's own profile, plus whether they're an admin. `profile` is null
    for an admin-only account with no self-serve profile — the dashboard
    already handles that case. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    const [profile, admin] = await Promise.all([
      getUserProfile(uid),
      isAdmin(uid),
    ]);
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
