import { handle, ok, jsonBody, str, BadRequest } from "@/lib/server/respond";
import { listCandidatesByRecruiter, createCandidate, getCandidate } from "@/lib/server/repo";
import { requireUid, requireActiveUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in recruiter's own saved candidates. Takes no uid — the server
    derives it from the verified token, so there's no way to ask for
    someone else's pool. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    return ok(await listCandidatesByRecruiter(uid));
  });
}

/** Save a candidate to the pool. CV is optional — see lib/candidates.ts. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    const body = await jsonBody(req);

    const id = await createCandidate(uid, {
      name: str(body.name, "name", { max: 255, required: true }),
      email: str(body.email, "email", { max: 320, required: true }),
      phone: str(body.phone, "phone", { max: 64, required: true }),
      linkedin: str(body.linkedin, "linkedin", { max: 512 }),
      photoUrl: str(body.photoUrl, "photoUrl", { max: 1024 }),
      notes: str(body.notes, "notes"),
      cvFileId: body.cvFileId === undefined ? undefined : str(body.cvFileId, "cvFileId", { max: 36 }),
    }).catch((err: unknown) => {
      // uq_candidates_recruiter_email — this recruiter already saved this email.
      if (
        err &&
        typeof err === "object" &&
        (err as { code?: string }).code === "ER_DUP_ENTRY"
      ) {
        throw new BadRequest(
          "You already have a candidate saved with this email — edit them instead of adding a duplicate.",
        );
      }
      throw err;
    });

    return ok(await getCandidate(id), { status: 201 });
  });
}
