import { handle, ok, BadRequest } from "@/lib/server/respond";
import { requireUid } from "@/lib/server/auth";
import { execute } from "@/lib/db";
import {
  newFileId, validateUpload, safeFilename, MAX_CV_BYTES,
} from "@/lib/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* File upload. Bytes go into the `files` table as a MEDIUMBLOB.

   Sign-in is REQUIRED for both kinds. Leaving CV upload open while the
   submission endpoint required a login would be pointless: anyone could still
   fill the table with 10 MB blobs against a 4 GB account-wide quota, with no
   account to attribute or rate-limit.

   DEPLOYMENT LIMIT: Vercel caps a serverless function's request body at about
   4.5 MB. The 10 MB CV limit below is enforceable when self-hosting or on a
   platform without that cap; on Vercel, uploads above ~4.5 MB are rejected by
   the platform before this handler ever runs. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);

    const form = await req.formData().catch(() => {
      throw new BadRequest("Expected a multipart form upload.");
    });

    const kindRaw = form.get("kind");
    const kind = kindRaw === "avatar" ? "avatar" : "cv";
    if (kindRaw !== "cv" && kindRaw !== "avatar") {
      throw new BadRequest("kind must be 'cv' or 'avatar'.");
    }

    const file = form.get("file");
    if (!(file instanceof File)) throw new BadRequest("No file was uploaded.");

    const problem = validateUpload(kind, file.type, file.size);
    if (problem) throw new BadRequest(problem);

    const bytes = Buffer.from(await file.arrayBuffer());
    /* file.size is what the client declared; bytes.length is what actually
       arrived. Re-check, so a lying size header cannot smuggle a larger blob. */
    if (bytes.length > MAX_CV_BYTES) {
      throw new BadRequest("File is larger than 10 MB.");
    }

    const id = newFileId();
    const filename = safeFilename(file.name);

    await execute(
      `INSERT INTO files (id, kind, filename, content_type, byte_size, data, owner_uid)
       VALUES (?,?,?,?,?,?,?)`,
      [id, kind, filename, file.type, bytes.length, bytes, uid],
    );

    /* Avatars get a plain URL (they must work in an <img> tag). CV links are
       minted server-side, signed, only when a submission is read — so no
       download URL is returned here. */
    return ok(
      {
        id,
        filename,
        size: bytes.length,
        ...(kind === "avatar" ? { url: `/api/files/${id}` } : {}),
      },
      { status: 201 },
    );
  });
}
