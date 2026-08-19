import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

/* Default OG/Twitter card for every page that doesn't set its own. Node
   runtime (not edge) specifically so this can read the logo straight off
   disk via fs — the same file public/jobfolder-logo-dark.png already ships
   in the deployment, so there's no separate asset to keep in sync. */
export const alt = "JobFolder — Engineering, Civil & DOT Recruiting Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoPath = path.join(process.cwd(), "public", "jobfolder-logo-dark.png");
  const logo = readFileSync(logoPath).toString("base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "100px",
          background: "#123173",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo}`}
          width={620}
          height={180}
          alt=""
        />
        <div
          style={{
            marginTop: 36,
            fontSize: 34,
            color: "#c9d4e8",
            maxWidth: 880,
          }}
        >
          Engineering, Civil &amp; DOT Recruiting Agency
        </div>
      </div>
    ),
    { ...size },
  );
}
