import Link from "next/link";
import type { ReactNode } from "react";

/* Layout container — consistent max width + gutters across sections */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
};

/* Pill buttons matching the reference: filled green + subtle outline */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
    outline: "border border-line text-ink hover:border-ink/30 hover:bg-black/[0.02]",
    ghost: "text-ink hover:text-primary",
  }[variant];

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

/* Small coral eyebrow label used above headings */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow uppercase tracking-wide">{children}</span>;
}
