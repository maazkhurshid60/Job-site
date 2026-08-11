import Link from "next/link";
import Image from "next/image";

const VARIANTS = {
  // Original lockup — dark wordmark, reads on the white/light backgrounds
  // used everywhere except the site navbar (auth cards, footer, admin
  // console, dashboard sidebar).
  onLight: { src: "/jobfolder-logo.png", width: 839, height: 263 },
  // Newer mark — light wordmark and tagline, drawn for the dark navbar.
  // Unreadable on a white background; do not use it there.
  onDark: { src: "/jobfolder-logo-dark.png", width: 927, height: 269 },
};

/* jobfolder.com logo — self-hosted, trimmed from the source lockup in /public. */
export function Logo({
  className = "",
  variant = "onLight",
}: {
  className?: string;
  variant?: keyof typeof VARIANTS;
}) {
  const asset = VARIANTS[variant];
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="jobfolder.com home"
    >
      {/* width/height must match the file's real pixel size — they set the
          intrinsic aspect ratio, and with `h-11 w-auto` the browser derives
          the rendered width from them, so a stale pair stretches the artwork. */}
      <Image
        src={asset.src}
        alt="JobFolder"
        width={asset.width}
        height={asset.height}
        priority
        className="h-11 w-auto"
      />
    </Link>
  );
}
