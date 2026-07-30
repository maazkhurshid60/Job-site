import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { howSteps } from "@/lib/howItWorks";
import { guides } from "@/lib/hiringGuides";
import { listOpenJobs } from "@/lib/jobs";

/* Regenerate hourly so newly posted roles reach the sitemap without a redeploy. */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

const staticRoutes: { path: string; priority: number; freq: Entry["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, freq: "weekly" },
  { path: "/jobs", priority: 0.9, freq: "daily" },
  { path: "/how-it-works", priority: 0.8, freq: "monthly" },
  { path: "/recruiters", priority: 0.8, freq: "monthly" },
  { path: "/hiring-guides", priority: 0.7, freq: "monthly" },
  { path: "/case-studies", priority: 0.7, freq: "monthly" },
  { path: "/recruiter-faq", priority: 0.7, freq: "monthly" },
  { path: "/contact", priority: 0.6, freq: "yearly" },
  { path: "/careers", priority: 0.4, freq: "monthly" },
  { path: "/press", priority: 0.4, freq: "yearly" },
  { path: "/privacy", priority: 0.2, freq: "yearly" },
  { path: "/terms", priority: 0.2, freq: "yearly" },
  { path: "/cookie-policy", priority: 0.2, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  for (const step of howSteps) {
    entries.push({
      url: `${SITE_URL}/how-it-works/${step.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const guide of guides) {
    entries.push({
      url: `${SITE_URL}/hiring-guides/${guide.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  /* Open roles are the highest-churn URLs on the site. A Firestore outage or a
     missing config must never fail the build, so this is best-effort only. */
  try {
    const jobs = await listOpenJobs();
    for (const job of jobs) {
      entries.push({
        url: `${SITE_URL}/jobs/${job.id}`,
        lastModified: toDate(job.updatedAt) ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Static routes alone still make a valid sitemap.
  }

  return entries;
}

/** Firestore hands back a Timestamp; tolerate a plain Date or millis too. */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const ts = value as { toDate?: () => Date };
  return typeof ts.toDate === "function" ? ts.toDate() : null;
}
