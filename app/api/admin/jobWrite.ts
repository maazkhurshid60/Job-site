import "server-only";
import {
  str, intOrNull, bool, oneOf, jsonArray, BadRequest,
} from "@/lib/server/respond";
import type { JobWrite } from "@/lib/server/repo";
import { EMPLOYMENT_TYPES } from "@/lib/jobs";

const STATUSES = ["draft", "open", "closed"] as const;

/* Salary and commission columns are INT UNSIGNED (max 4,294,967,295). Rejecting
   anything above a plausible ceiling here gives the admin a clear message
   instead of a database error, and stops a typo'd figure ever being stored. */
const MAX_MONEY = 100_000_000;

/* Shared body validation for POST /api/admin/jobs and PUT /api/admin/jobs/[id].
   Kept out of the route files because Next treats every export in a route.ts as
   a route config value, and an unrecognised one is a build error. */
export function readJobWrite(body: Record<string, unknown>): JobWrite {
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

  return {
    title: str(body.title, "title", { max: 255, required: true }),
    company: str(body.company, "company", { max: 255 }),
    category: str(body.category, "category", { max: 128 }) || "Other",
    location: str(body.location, "location", { max: 255 }),
    remote: bool(body.remote),
    employmentType: oneOf(
      body.employmentType,
      EMPLOYMENT_TYPES,
      "employmentType",
      "Full-time",
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
