import { NextResponse } from "next/server";
import { handle } from "@/lib/server/respond";
import { listMetroTeamMembers } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What a syndicated team member looks like off-site. Only fields safe to
    publish — no email, phone, or account id. */
type PublicTeamMember = {
  name: string;
  headline: string;
  company: string;
  location: string;
  bio: string;
  photoURL: string;
  linkedin: string;
  website: string;
  twitter: string;
  facebook: string;
  instagram: string;
};

/* Public, unauthenticated: recruiters an admin has approved to appear on
   Metro Associates' "Meet Our Team" page (see the console's recruiter detail
   view). This is the one endpoint meant to be fetched cross-origin, by the
   separate Metro Associates site — CORS is opened for exactly that, and
   nothing here is sensitive enough to need narrowing it to one origin. */
export function GET(req: Request) {
  return handle(async () => {
    const origin = new URL(req.url).origin;
    const members = await listMetroTeamMembers();

    const data: PublicTeamMember[] = members.map((m) => ({
      name: m.name,
      headline: m.headline,
      company: m.company,
      location: m.location,
      bio: m.bio,
      // Stored as a relative path (e.g. /api/files/{id}); made absolute here
      // since the consuming site is a different origin.
      photoURL: m.photoURL ? new URL(m.photoURL, origin).toString() : "",
      linkedin: m.linkedin,
      website: m.website,
      twitter: m.twitter,
      facebook: m.facebook,
      instagram: m.instagram,
    }));

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        // Public roster, changes rarely — a short shared cache saves a
        // round trip to MySQL on every Metro page view. Kept in step with
        // the revalidate window on Metro's own fetch (jobfolderTeam.ts) and
        // its page-level `revalidate`, or the two caches stack: a longer
        // s-maxage here was observed leaking into Next's page-level
        // stale-while-revalidate window on the consuming site, holding a
        // toggled-off recruiter visible for minutes after the change.
        "Cache-Control": "public, max-age=30, s-maxage=30",
      },
    });
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
