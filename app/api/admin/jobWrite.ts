import "server-only";
import {
  str, intOrNull, bool, oneOf, jsonArray, BadRequest,
} from "@/lib/server/respond";
import type { JobWrite } from "@/lib/server/repo";
import { getSetting } from "@/lib/server/repo";
import { EMPLOYMENT_TYPES } from "@/lib/jobs";
import { DEFAULT_FILTERS, type BoardFilters } from "@/lib/boardFilters";

const STATUSES = ["draft", "open", "closed"] as const;

/* Salary and commission columns are INT UNSIGNED (max 4,294,967,295). Rejecting
   anything above a plausible ceiling here gives the admin a clear message
   instead of a database error, and stops a typo'd figure ever being stored. */
const MAX_MONEY = 100_000_000;

/* Shared body validation for POST /api/admin/jobs and PUT /api/admin/jobs/[id].
   Kept out of the route files because Next treats every export in a route.ts as
   a route config value, and an unrecognised one is a build error. */
/* The employment types this job may use.
 *
 * Read from settings, not the constant: job types are admin-editable now, and
 * validating against the hardcoded list would reject a type the admin had just
 * added on their own filters page — the posting form would offer it and the
 * API would refuse it. Falls back to the constants if the read fails, so a
 * settings outage can't block job posting entirely. */
async function allowedEmploymentTypes(): Promise<string[]> {
  try {
    const saved = await getSetting<Partial<BoardFilters>>("boardFilters", {});
    return saved.employmentTypes?.length
      ? saved.employmentTypes
      : DEFAULT_FILTERS.employmentTypes;
  } catch {
    return [...EMPLOYMENT_TYPES];
  }
}

export async function readJobWrite(body: Record<string, unknown>): Promise<JobWrite> {
  const salaryMin = intOrNull(body.salaryMin, "salaryMin");
  const salaryMax = intOrNull(body.salaryMax, "salaryMax");

  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
    throw new BadRequest("salaryMin cannot be greater than salaryMax.");
  }
  for (const [value, field] of [
    [salaryMin, "salaryMin"],
    [salaryMax, "salaryMax"],
    [intOrNull(body.bounty, "bounty"), "bounty"],
  ] as const) {
    if (value === null) continue;
    if (value < 0) throw new BadRequest(`${field} cannot be negative.`);
    if (value > MAX_MONEY) {
      throw new BadRequest(
        `${field} looks wrong — it must be ${MAX_MONEY.toLocaleString()} or less.`,
      );
    }
  }

  const types = await allowedEmploymentTypes();

  return {
    title: str(body.title, "title", { max: 255, required: true }),
    company: str(body.company, "company", { max: 255 }),
    category: str(body.category, "category", { max: 128 }) || "Other",
    location: str(body.location, "location", { max: 255 }),
    remote: bool(body.remote),
    employmentType: oneOf(
      body.employmentType,
      types,
      "employmentType",
      types[0],
    ),
    salaryMin,
    salaryMax,
    bounty: intOrNull(body.bounty, "bounty"),
    description: str(body.description, "description"),
    responsibilities: str(body.responsibilities, "responsibilities"),
    requirements: str(body.requirements, "requirements"),
    faqs: jsonArray(body.faqs, "faqs"),
    screeningQuestions: jsonArray(body.screeningQuestions, "screeningQuestions"),
    hiringStages: jsonArray(body.hiringStages, "hiringStages"),
    status: oneOf(body.status, STATUSES, "status", "draft"),
  };
}
