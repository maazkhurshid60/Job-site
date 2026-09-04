"use client";

import type { SortOption } from "@/lib/sorting";

/* The "Sort" dropdown used across the list pages. Matches the control that
   was already on the public jobs board, so the two don't read as different
   products — that one predates this component and is left where it is. */
export function SortSelect<T>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SortOption<T>[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label
      className={`flex shrink-0 items-center gap-2 rounded-pill border border-line bg-white px-3 text-xs ${className}`}
    >
      <span className="text-muted">Sort</span>
      <select
        className="cursor-pointer border-0 bg-transparent py-1.5 pr-5 text-xs font-semibold text-ink outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort order"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
