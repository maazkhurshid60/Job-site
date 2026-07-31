/* Console load failure.
 *
 * These pages used to catch every error and print "Check your Firestore rules"
 * — a database this app no longer uses, and advice that couldn't fix anything.
 * It also hid the real cause, which the API already sends in a readable form
 * (`{ error: "..." }`, surfaced by apiFetch). So show that instead, and give a
 * way to retry without a full page reload. */
export function LoadError({
  what,
  message,
  onRetry,
}: {
  /** What failed to load, lowercase: "submissions", "the job list". */
  what: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-coral/30 bg-coral-soft px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-coral">
            Couldn&apos;t load {what}
          </p>
          {/* The server's own words. Worth showing verbatim: "Sign in required."
              and "Admin access required." each point at a different fix. */}
          <p className="mt-0.5 text-sm text-ink/70">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-pill bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-coral/30 hover:ring-coral"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/** Normalise a thrown value into something worth showing a person. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
