import Link from "next/link";

/* Metro Opportunities wordmark — green mark + two-tone text, echoing the ref */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="Metro Opportunities home"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2 13V3l4 5 4-5v10M14 3v10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Metro<span className="text-primary">Opportunities</span>
      </span>
    </Link>
  );
}
