import Link from "next/link";
import Image from "next/image";

/* jobfolder.com logo — self-hosted, trimmed from the source lockup in /public. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="jobfolder.com home"
    >
      <Image
        src="/jobfolder-logo.png"
        alt="jobfolder.com"
        width={945}
        height={264}
        priority
        className="h-11 w-auto"
      />
    </Link>
  );
}
