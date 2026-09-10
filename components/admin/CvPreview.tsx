"use client";

import { useEffect, useRef, useState } from "react";

/* In-console CV preview.
 *
 * Three formats, three mechanisms, because browsers can only render one of
 * them natively and the other two need converting first:
 *
 *  - PDF  -> drawn to a <canvas> by pdf.js, in this tab.
 *
 *            It used to be an <iframe> pointing at the file, leaving the
 *            rendering to the browser's built-in PDF viewer. That works until
 *            it doesn't: Chrome set to "Download PDFs" instead of "Open PDFs
 *            in Chrome" — a per-machine setting, and one some IT policies set
 *            centrally — refuses to render inside a frame and substitutes a
 *            grey download stub showing the file's UUID. The reviewer sees a
 *            broken preview of a file that is perfectly intact; verified in
 *            this case, the stored bytes were a valid %PDF-1.7 of 130,155
 *            bytes and rendered fine on another machine.
 *
 *            pdf.js removes the dependency on that setting entirely. It also
 *            keeps the privacy property below, since it runs here in the tab
 *            rather than shipping the file anywhere.
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
  if (contentType === PDF) return <PdfPreview url={url} filename={filename} />;

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

/* PDF rendered here in the tab, not by the browser's viewer.
 *
 * Every page is drawn to its own <canvas> at the container's width, so a CV
 * is read by scrolling rather than by fighting a nested scrollbar. Rendering
 * is sequential and cancellable: closing the drawer mid-render aborts rather
 * than drawing into canvases React has already unmounted.
 *
 * The worker is imported as a URL so the bundler emits it as an asset and it
 * is served from our own origin — no CDN, which matters because the alternative
 * would put a candidate's CV through a third party's script. */
function PdfPreview({ url, filename }: { url: string; filename: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvases: HTMLCanvasElement[] = [];

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        /* Fetched rather than handed the URL, so one signed link is used once
           and the bytes are already here if a re-render is needed. */
        const res = await fetch(`${url}&inline=1`);
        if (!res.ok) throw new Error(`Could not fetch the file (${res.status}).`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;

        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setPages(doc.numPages);

        const host = hostRef.current;
        if (!host) return;
        host.replaceChildren();

        const width = host.clientWidth || 720;
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          /* Scale to the column, then multiply by DPR so the text is sharp on
             the high-density screens most of this is reviewed on. */
          const scale = (width / base.width) * Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "mb-3 rounded-lg border border-line bg-white shadow-sm";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `${filename}, page ${n} of ${doc.numPages}`);

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("This browser could not open a canvas to draw on.");
          host.append(canvas);
          canvases.push(canvas);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not render this PDF.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const c of canvases) c.remove();
    };
  }, [url, filename]);

  if (error) return <Unavailable url={url} reason={error} />;

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-paper">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-3 py-2">
        <p className="truncate text-xs text-muted">
          {pages === null ? `Opening ${filename}…` : `${filename} · ${pages} page${pages === 1 ? "" : "s"}`}
        </p>
        {/* Always available, whatever the browser is set to do with PDFs. */}
        <a
          href={`${url}&inline=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent underline underline-offset-2"
        >
          Open in a new tab
        </a>
      </div>
      <div ref={hostRef} className="min-h-0 flex-1 overflow-y-auto p-3" />
    </div>
  );
}
