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
      {/* width/height must match the file's real pixel size. They set the
          intrinsic aspect ratio, and with `h-11 w-auto` the browser derives the
          rendered width from them — so a stale pair stretches the artwork. The
          file is 839×263; it was declared 945×264, making the logo ~13% wide. */}
      <Image
        src="/jobfolder-logo.png"
        alt="jobfolder.com"
        width={839}
        height={263}
        priority
        className="h-11 w-auto"
      />
    </Link>
  );
}
