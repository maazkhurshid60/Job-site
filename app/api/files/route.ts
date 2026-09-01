import { handle, ok, BadRequest } from "@/lib/server/respond";
import { requireActiveUid } from "@/lib/server/auth";
import { execute } from "@/lib/db";
import {
  newFileId, validateUpload, safeFilename, maxBytesFor, type FileKind,
} from "@/lib/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: FileKind[] = ["cv", "avatar", "video"];

/* File upload. Bytes go into the `files` table as a MEDIUMBLOB.

   Sign-in is REQUIRED for every kind. Leaving CV upload open while the
   submission endpoint required a login would be pointless: anyone could still
   fill the table with multi-MB blobs against a 4 GB account-wide quota, with
   no account to attribute or rate-limit.

   DEPLOYMENT LIMIT: Vercel caps a serverless function's request body at about
   4.5 MB, so MAX_CV_BYTES/MAX_VIDEO_BYTES (lib/server/files.ts) are
   deliberately 4 MB, not a more generous figure — anything higher would pass
   this route's own check but still get rejected by the platform first with an
   opaque 413. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireActiveUid(req);

    const form = await req.formData().catch(() => {
      throw new BadRequest("Expected a multipart form upload.");
    });

    const kindRaw = form.get("kind");
    if (!KINDS.includes(kindRaw as FileKind)) {
      throw new BadRequest("kind must be 'cv', 'avatar', or 'video'.");
    }
    const kind = kindRaw as FileKind;

    const file = form.get("file");
    if (!(file instanceof File)) throw new BadRequest("No file was uploaded.");

    const problem = validateUpload(kind, file.type, file.size);
    if (problem) throw new BadRequest(problem);

    const bytes = Buffer.from(await file.arrayBuffer());
    /* file.size is what the client declared; bytes.length is what actually
       arrived. Re-check, so a lying size header cannot smuggle a larger blob. */
    const max = maxBytesFor(kind);
    if (bytes.length > max) {
      throw new BadRequest(`File is larger than ${Math.round(max / 1048576)} MB.`);
    }

    const id = newFileId();
    const filename = safeFilename(file.name);

    await execute(
      `INSERT INTO files (id, kind, filename, content_type, byte_size, data, owner_uid)
       VALUES (?,?,?,?,?,?,?)`,
      [id, kind, filename, file.type, bytes.length, bytes, uid],
    );

    /* Avatars get a plain URL (they must work in an <img> tag). CV and video
       links are minted server-side, signed, only when a submission or
       recruiter profile is read — so no download URL is returned here. */
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
