"use client";

import { useEffect, useRef, useState } from "react";

/* In-console CV preview.
 *
 * Three formats, three mechanisms, because browsers can only render one of
 * them natively and the other two need converting first:
 *
 *  - PDF  -> the browser's own viewer in an <iframe>. The server serves it with
 *            `Content-Security-Policy: sandbox` and only after checking the
 *            bytes really start with %PDF-, so it lands in an opaque origin.
 *  - DOCX -> converted to HTML in this browser tab by mammoth, then rendered
 *            inside a sandboxed iframe.
 *  - DOC  -> pre-2007's OLE compound-file binary format, which has no
 *            browser-side parser. Plain text is extracted server-side (see
 *            GET /api/files/[id]?extract=1) and rendered the same way as the
 *            DOCX HTML — formatting doesn't survive, but the content does.
 *
 * The DOCX conversion is deliberately client-side, and the DOC extraction
 * deliberately stays inside our own server. The obvious shortcut — pointing a
 * third-party viewer (Google/Office) at the file URL — would mean uploading a
 * candidate's CV to someone else's servers. These are signed, expiring links
 * to personal data; they don't get handed to another company. */

const PDF = "application/pdf";
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC = "application/msword";

export function canPreview(contentType: string): boolean {
  return contentType === PDF || contentType === DOCX || contentType === DOC;
}

export function CvPreview({
  url,
  contentType,
  filename,
}: {
  /** The signed, one-hour link from the submission. */
  url: string;
  contentType: string;
  filename: string;
}) {
  if (contentType === PDF) {
    return (
      <iframe
        // inline=1 is honoured only for verified PDFs; anything else downloads.
        src={`${url}&inline=1`}
        title={`Preview of ${filename}`}
        className="h-full w-full rounded-xl border border-line bg-white"
      />
    );
  }

  if (contentType === DOCX) return <DocxPreview url={url} filename={filename} />;
  if (contentType === DOC) return <DocPreview url={url} filename={filename} />;

  return (
    <Unavailable
      url={url}
      reason="This file type can't be previewed in a browser."
    />
  );
}

function DocxPreview({ url, filename }: { url: string; filename: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not fetch the file (${res.status}).`);
        const buffer = await res.arrayBuffer();
        /* Imported here, not at module scope: mammoth is ~150 KB and only the
           handful of admins who open a .docx should ever pay for it. */
        const mammoth = await import("mammoth/mammoth.browser.min.js");
        const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (active) setHtml(value || "<p><em>This document appears to be empty.</em></p>");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not read this document.",
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [url]);

  /* Written into a sandboxed iframe via srcDoc rather than dangerouslySet-
     InnerHTML. mammoth's output is derived from an untrusted upload, so it is
     never given this page's origin: `sandbox` with no allow-* tokens blocks
     scripts, forms and navigation outright. */
  useEffect(() => {
    if (html === null || !frameRef.current) return;
    frameRef.current.srcdoc = `<!doctype html><meta charset="utf-8">
<style>
  body{font:14px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;color:#17130f;
       margin:0;padding:28px 32px;background:#fff}
  h1,h2,h3{line-height:1.25;margin:1.4em 0 .5em}
  p{margin:0 0 .85em} table{border-collapse:collapse;margin:1em 0}
  td,th{border:1px solid #ece5db;padding:6px 10px;text-align:left}
  img{max-width:100%;height:auto} a{color:#224fa8}
</style>${html}`;
  }, [html]);

  if (error) return <Unavailable url={url} reason={error} />;

  if (html === null) {
    return (
      <div className="grid h-full place-items-center rounded-xl border border-line bg-white">
        <p className="text-sm text-muted">Reading {filename}…</p>
      </div>
    );
  }

  return (
    <iframe
      ref={frameRef}
      sandbox=""
      title={`Preview of ${filename}`}
      className="h-full w-full rounded-xl border border-line bg-white"
    />
  );
}

function DocPreview({ url, filename }: { url: string; filename: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${url}&extract=1`);
        const data = (await res.json().catch(() => null)) as
          | { text?: string; error?: string }
          | null;
        if (!res.ok) {
          throw new Error(data?.error || `Could not read the file (${res.status}).`);
        }
        if (active) setText(data?.text || "This document appears to be empty.");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not read this document.",
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [url]);

  /* Same sandboxed-srcdoc approach as DocxPreview, and for the same reason:
     this text came out of an untrusted upload. Escaped rather than trusted,
     even though .doc extraction yields plain text with no markup of its own —
     a résumé that happens to contain "<script>" as literal text must render
     as that literal text, not be interpreted. */
  useEffect(() => {
    if (text === null || !frameRef.current) return;
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    frameRef.current.srcdoc = `<!doctype html><meta charset="utf-8">
<style>
  body{font:14px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;color:#17130f;
       margin:0;padding:28px 32px;background:#fff;
       white-space:pre-wrap;word-wrap:break-word}
</style>${escaped}`;
  }, [text]);

  if (error) return <Unavailable url={url} reason={error} />;

  if (text === null) {
    return (
      <div className="grid h-full place-items-center rounded-xl border border-line bg-white">
        <p className="text-sm text-muted">Reading {filename}…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="shrink-0 text-xs text-muted">
        Extracted text — this legacy .doc format doesn&apos;t preserve formatting.
      </p>
      <iframe
        ref={frameRef}
        sandbox=""
        title={`Preview of ${filename}`}
        className="h-full w-full rounded-xl border border-line bg-white"
      />
    </div>
  );
}

function Unavailable({ url, reason }: { url: string; reason: string }) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-line bg-white p-8 text-center">
      <div>
        <p className="text-sm font-semibold text-ink">Preview unavailable</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{reason}</p>
        <a
          href={url}
          className="mt-4 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Download the CV
        </a>
      </div>
    </div>
  );
}
