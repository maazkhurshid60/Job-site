/* Shared CV upload constraints (used by the candidate submission flow).
   Capped at 4 MB, not the 10 MB the storage layer could otherwise take —
   Vercel rejects request bodies over ~4.5 MB before the upload route ever
   runs, so this stays under that with headroom for multipart overhead. See
   lib/server/files.ts and app/api/files/route.ts for the matching server
   limit. */
export const MAX_CV_BYTES = 4 * 1024 * 1024; // 4 MB
export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
