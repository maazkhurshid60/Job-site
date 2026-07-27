/* Branded loading indicator — three pulsing dots in the brand colors. */

const DOTS = [
  { color: "#ee5b3f", delay: "-0.22s" }, // coral
  { color: "#224fa8", delay: "-0.11s" }, // blue brand
  { color: "#c0d64e", delay: "0s" }, // lime
];

export function Loader({
  size = 10,
  label,
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center" style={{ gap: size * 0.6 }}>
        {DOTS.map((d) => (
          <span
            key={d.color}
            className="loader-dot rounded-full"
            style={{
              width: size,
              height: size,
              background: d.color,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>
      {label && <p className="text-sm text-muted">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/* Full-viewport centered loader, for route guards. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-white">
      <Loader size={12} label={label} />
    </div>
  );
}

/* Loader centered inside a bordered panel, for list/section loading. */
export function PanelLoader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid h-44 place-items-center rounded-2xl border border-line bg-white ${className}`}
    >
      <Loader />
    </div>
  );
}
