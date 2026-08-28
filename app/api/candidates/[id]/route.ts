import { handle, ok, jsonBody, str, BadRequest, NotFound } from "@/lib/server/respond";
import { getCandidate, updateCandidate, deleteCandidate, cvFileOwnedBy } from "@/lib/server/repo";
import { requireActiveUid, AuthError } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Update a saved candidate. Only its owner may edit it. */
export function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    const { id } = await params;

    const existing = await getCandidate(id);
    if (!existing) throw new NotFound("Saved candidate not found.");
    if (existing.recruiterId !== uid) {
      throw new AuthError("You can only edit your own saved candidates.", 403);
    }

    const body = await jsonBody(req);
    const cvFileId = body.cvFileId === undefined ? undefined : str(body.cvFileId, "cvFileId", { max: 36 });
    if (cvFileId !== undefined && !(await cvFileOwnedBy(cvFileId, uid))) {
      throw new BadRequest("That CV upload is missing or doesn't belong to you.");
    }

    await updateCandidate(id, {
      name: str(body.name, "name", { max: 255, required: true }),
      email: str(body.email, "email", { max: 320, required: true }),
      phone: str(body.phone, "phone", { max: 64, required: true }),
      linkedin: str(body.linkedin, "linkedin", { max: 512 }),
      notes: str(body.notes, "notes"),
      cvFileId,
      photoUrl: body.photoUrl === undefined ? undefined : str(body.photoUrl, "photoUrl", { max: 1024 }),
    }).catch((err: unknown) => {
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

    return ok(await getCandidate(id));
  });
}

/** Remove a saved candidate. Only its owner may delete it. */
export function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    const { id } = await params;

    const existing = await getCandidate(id);
    if (!existing) throw new NotFound("Saved candidate not found.");
    if (existing.recruiterId !== uid) {
      throw new AuthError("You can only remove your own saved candidates.", 403);
    }

    await deleteCandidate(id);
    return ok({ id });
  });
}
