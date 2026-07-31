import { NextResponse } from "next/server";
import { handle, NotFound } from "@/lib/server/respond";
import { AuthError } from "@/lib/server/auth";
import { queryOne } from "@/lib/db";
import { verifyFileUrl, safeFilename } from "@/lib/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FileRow = {
  kind: "cv" | "avatar";
  filename: string;
  content_type: string;
  byte_size: number;
  data: Buffer;
};

/* Serve a stored file.

   Avatars are public — they render in <img> tags, which cannot send an
   Authorization header, and a profile photo is low-sensitivity.

   CVs require a valid signature and expiry. Those links are minted only when
   returning a submission the caller was already entitled to read, so download
   rights follow read rights and expire on their own. */
export function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;

    const row = await queryOne<FileRow>(
      "SELECT kind, filename, content_type, byte_size, data FROM files WHERE id = ?",
      [id],
    );
    if (!row) throw new NotFound("File not found.");

    if (row.kind === "cv") {
      const url = new URL(req.url);
      const valid = verifyFileUrl(
        id,
        url.searchParams.get("exp"),
        url.searchParams.get("sig"),
      );
      if (!valid) {
        throw new AuthError("This download link is invalid or has expired.", 403);
      }
    }

    /* CVs download by default. `?inline=1` asks for in-browser preview, and is
       granted only for a file we have positively identified as a PDF:

         - the stored content_type must be exactly application/pdf, and
         - the bytes must actually start with %PDF-.

       The declared type alone is not enough — it comes from the uploader, so a
       .html or .svg labelled application/pdf would otherwise be served inline
       and execute. The magic-byte check is what makes this safe.

       Even then the response carries `Content-Security-Policy: sandbox`, which
       puts it in an opaque origin with scripts disabled. That answers the
       original objection to inline rendering: a PDF served this way cannot
       touch this origin's cookies or storage. */
    const wantsInline = new URL(req.url).searchParams.get("inline") === "1";
    const isRealPdf =
      row.content_type === "application/pdf" &&
      row.data.subarray(0, 5).toString("latin1") === "%PDF-";
    const previewable = row.kind === "cv" && wantsInline && isRealPdf;

    const disposition =
      row.kind === "cv" && !previewable
        ? `attachment; filename="${safeFilename(row.filename)}"`
        : `inline; filename="${safeFilename(row.filename)}"`;

    const headers: Record<string, string> = {
      "Content-Type": row.content_type || "application/octet-stream",
      "Content-Length": String(row.byte_size),
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      // Avatars are immutable once uploaded; CV links expire, so never cache.
      "Cache-Control":
        row.kind === "avatar"
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
    };
    if (previewable) {
      headers["Content-Security-Policy"] =
        "sandbox; default-src 'none'; object-src 'none'; script-src 'none'";
    }

    return new NextResponse(new Uint8Array(row.data), { status: 200, headers });
  });
}
