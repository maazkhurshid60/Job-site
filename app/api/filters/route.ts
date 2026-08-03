import { handle, ok, jsonBody, BadRequest, str } from "@/lib/server/respond";
import { getSetting, setSetting } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { DEFAULT_FILTERS, US_STATES, type BoardFilters } from "@/lib/boardFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "boardFilters";

/* A ceiling on the ceiling. The pay slider steps in $5,000, so an unbounded
   value would render thousands of steps and a filter nobody can drag
   accurately — and salaries are already validated against MAX_MONEY on write. */
const MAX_SALARY_CEILING = 5_000_000;

/** Public read — the job board and the posting form both need this. */
export function GET() {
  return handle(async () => {
    const saved = await getSetting<Partial<BoardFilters>>(KEY, {});
    return ok({
      employmentTypes: saved.employmentTypes?.length
        ? saved.employmentTypes
        : DEFAULT_FILTERS.employmentTypes,
      salaryMax: saved.salaryMax ?? DEFAULT_FILTERS.salaryMax,
      states: saved.states ?? [],
    } satisfies BoardFilters);
  });
}

/** Trim, drop blanks, de-dupe case-insensitively, keep the admin's order. */
function cleanList(input: unknown, label: string, max = 128): string[] {
  if (!Array.isArray(input)) throw new BadRequest(`${label} must be an array.`);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const value = str(raw, label, { max });
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** Admin write. */
export function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const body = await jsonBody(req);

    const employmentTypes = cleanList(body.employmentTypes, "employment type", 64);
    if (!employmentTypes.length) {
      throw new BadRequest("At least one job type is required.");
    }

    const salaryMax = Number(body.salaryMax);
    if (!Number.isFinite(salaryMax) || salaryMax <= 0) {
      throw new BadRequest("The pay ceiling must be a positive number.");
    }
    if (salaryMax > MAX_SALARY_CEILING) {
      throw new BadRequest(
        `The pay ceiling can't be above $${MAX_SALARY_CEILING.toLocaleString()}.`,
      );
    }

    /* States are picked from a fixed list, so anything else is a bug or a
       tampered request — reject rather than silently store a value the
       location dropdown could never match against a job. */
    const states = cleanList(body.states, "state", 64);
    const unknown = states.filter((s) => !US_STATES.includes(s));
    if (unknown.length) {
      throw new BadRequest(`Not a US state: ${unknown.slice(0, 3).join(", ")}`);
    }

    const filters: BoardFilters = {
      employmentTypes,
      // Round to the slider's step so the maximum is actually reachable.
      salaryMax: Math.round(salaryMax / 5000) * 5000 || 5000,
      states,
    };
    await setSetting(KEY, filters);
    return ok(filters);
  });
}
