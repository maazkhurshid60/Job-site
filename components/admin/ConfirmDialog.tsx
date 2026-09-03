"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* An "are you sure?" step for admin actions that change what a recruiter can
 * do — verification, suspension, website access, team membership.
 *
 * These were window.confirm, which works but has two problems for grants:
 * it can't show the consequence with any emphasis, and Chrome lets a user
 * tick "prevent this page from creating more dialogs", after which every
 * later confirm silently returns false — an admin clicks Verify, nothing
 * happens, and there's no error to explain why.
 *
 * useConfirm() keeps window.confirm's shape so callers stay readable:
 *
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title, message }))) return;
 *   return <>{dialog}{...}</>;
 */

export type ConfirmOptions = {
  title: string;
  message: string;
  /** Second line, for the consequence worth reading twice. */
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for taking access away; "primary" for granting it. */
  tone?: "primary" | "danger";
};

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  /* The resolver lives in a ref, not in state: resolving inside a state
     updater would fire twice under StrictMode's double-invoke. */
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setOpts(next);
      }),
    [],
  );

  const settle = useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpts(null);
    resolve?.(value);
  }, []);

  /* If the page navigates away mid-prompt, resolve false rather than leaving
     the caller awaiting forever with its "saving…" flag stuck on. */
  useEffect(
    () => () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    /* Taking access away defaults to Cancel, so a stray Enter can't do the
       damage; granting it defaults to the confirm button. */
    (opts.tone === "danger" ? cancelRef : confirmRef).current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [opts, settle]);

  const danger = opts?.tone === "danger";

  const dialog = opts ? (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={() => settle(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
              danger ? "bg-coral-soft text-coral" : "bg-primary-soft text-primary"
            }`}
          >
            <svg width="17" height="17" viewBox="0 0 22 22" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="8.2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M11 7v5M11 15h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-base font-extrabold tracking-tight text-ink">
              {opts.title}
            </h2>
            <p id="confirm-message" className="mt-1.5 text-sm leading-relaxed text-muted">
              {opts.message}
            </p>
            {opts.note && (
              <p
                className={`mt-2.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  danger ? "bg-coral-soft text-coral" : "bg-cream text-ink"
                }`}
              >
                {opts.note}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => settle(false)}
            className="rounded-pill border border-line px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink/30"
          >
            {opts.cancelLabel ?? "Cancel"}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => settle(true)}
            className={`rounded-pill px-4 py-2 text-xs font-semibold text-white transition-colors ${
              danger ? "bg-coral hover:opacity-90" : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {opts.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
