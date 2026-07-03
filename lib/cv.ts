/* Shared CV upload constraints (used by the candidate submission flow). */
export const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
