import Link from "next/link";
import { Logo } from "@/components/Logo";

/* Centered card used by the public login / signup pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_24px_60px_-30px_rgba(23,19,15,0.25)]">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        )}
        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

/* Shared labelled field. */
export function AuthField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
