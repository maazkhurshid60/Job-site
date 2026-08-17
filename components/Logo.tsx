import Link from "next/link";
import Image from "next/image";

const VARIANTS = {
  // Original lockup — dark wordmark, reads on the white/light backgrounds
  // used everywhere except the site navbar (auth cards, footer, admin
  // console, dashboard sidebar).
  onLight: { src: "/jobfolder-logo.png", width: 839, height: 263 },
  // Companion mark drawn for dark backgrounds — gold folder, white wordmark,
  // its own tagline. Reads correctly on navy; it only looks broken previewed
  // against white, which is a checker backdrop artifact, not the asset.
  onDark: { src: "/jobfolder-logo-dark.png", width: 927, height: 269 },
};

/* jobfolder.com logo — self-hosted, trimmed from the source lockup in /public. */
export function Logo({
  className = "",
  variant = "onLight",
  size = "h-11",
}: {
  className?: string;
  variant?: keyof typeof VARIANTS;
  /** Tailwind height class for the wordmark image — shrink this in tight spots. */
  size?: string;
}) {
  const asset = VARIANTS[variant];
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="jobfolder.com home"
    >
      {/* width/height must match the file's real pixel size — they set the
          intrinsic aspect ratio, and with `${size} w-auto` the browser derives
          the rendered width from them, so a stale pair stretches the artwork. */}
      <Image
        src={asset.src}
        alt="JobFolder"
        width={asset.width}
        height={asset.height}
        priority
        className={`${size} w-auto`}
      />
    </Link>
  );
}
