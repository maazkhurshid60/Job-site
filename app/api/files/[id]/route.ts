import { NextResponse } from "next/server";
import WordExtractor from "word-extractor";
import { handle, BadRequest, NotFound } from "@/lib/server/respond";
import { AuthError } from "@/lib/server/auth";
import { queryOne } from "@/lib/db";
import { verifyFileUrl, safeFilename } from "@/lib/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FileRow = {
  kind: "cv" | "avatar" | "video";
  filename: string;
  content_type: string;
  byte_size: number;
  data: Buffer;
};

/* Serve a stored file.

   Avatars are public — they render in <img> tags, which cannot send an
   Authorization header, and a profile photo is low-sensitivity.

   CVs and verification videos require a valid signature and expiry. Those
   links are minted only when returning a submission or recruiter profile the
   caller was already entitled to read, so download rights follow read rights
   and expire on their own. */
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

    const url = new URL(req.url);

    if (row.kind === "cv" || row.kind === "video") {
      const valid = verifyFileUrl(
        id,
        url.searchParams.get("exp"),
        url.searchParams.get("sig"),
      );
      if (!valid) {
        throw new AuthError("This download link is invalid or has expired.", 403);
      }
    }

    /* `?extract=1` — plain-text extraction for a legacy .doc CV, which
       otherwise has no in-browser preview: unlike .docx (a zip of XML,
       convertible client-side by mammoth) or PDF (rendered by the browser
       itself), pre-2007 .doc is an OLE compound-file binary format with no
       browser-side parser. Extracting it here, in the same trust boundary
       that already holds the raw bytes, keeps the CV from ever being handed
       to a third-party viewer just to render it — same reasoning as why the
       .docx conversion happens client-side rather than via Google/Office. */
    if (row.kind === "cv" && url.searchParams.get("extract") === "1") {
      if (row.content_type !== "application/msword") {
        throw new BadRequest("Text extraction is only available for .doc files.");
      }
      let text: string;
      try {
        const document = await new WordExtractor().extract(row.data);
        text = document.getBody();
      } catch {
        throw new BadRequest(
          "Could not read this document. It may be corrupted or password-protected.",
        );
      }
      return NextResponse.json(
        { text },
        { headers: { "Cache-Control": "private, no-store" } },
      );
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
    const wantsInline = url.searchParams.get("inline") === "1";
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
      // Avatars are immutable once uploaded; CV/video links expire, so never cache.
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
