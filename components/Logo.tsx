import Link from "next/link";

/* Metro Associates Logo — Blue house mark + dark text, styled to match the new layout */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="Metro Associates home"
    >
      <span className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-blue-brand text-white shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink font-sans">
        Metro<span className="text-blue-brand">Associates</span>
      </span>
    </Link>
  );
}
