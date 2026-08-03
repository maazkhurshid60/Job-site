import { apiFetch } from "./api";
import { EMPLOYMENT_TYPES } from "./jobs";

/* Everything the public job board filters by, controlled from the console.
 *
 * Categories already lived in settings under `jobCategories`; this is the rest
 * of the filter bar — job type, the pay slider's ceiling, and which US states
 * appear in the location dropdown. Stored as one settings row so the admin
 * page saves them together and they can't half-apply.
 *
 * The constants in lib/jobs.ts stay as the seed and the fallback: if the read
 * fails, the board still has a working filter bar rather than empty dropdowns.
 */

export type BoardFilters = {
  /** Job types offered on the board and in the posting form. */
  employmentTypes: string[];
  /** Upper end of the "Pay" slider, in whole dollars. */
  salaryMax: number;
  /** States shown in the location filter. Empty means every US state. */
  states: string[];
};

/* The full list. Kept here rather than in the page component so the admin
   screen and the board agree on what "all states" means. */
export const US_STATES: string[] = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming", "Washington, D.C.",
];

export const DEFAULT_FILTERS: BoardFilters = {
  employmentTypes: [...EMPLOYMENT_TYPES],
  salaryMax: 200_000,
  states: [],
};

/** The states to actually render — an empty saved list means all of them. */
export function statesFor(filters: BoardFilters): string[] {
  return filters.states.length ? filters.states : US_STATES;
}

/** Public read. Never throws: a broken filter bar shouldn't empty the board. */
export async function getBoardFilters(): Promise<BoardFilters> {
  try {
    const f = await apiFetch<Partial<BoardFilters>>("/api/filters");
    return {
      employmentTypes: f.employmentTypes?.length
        ? f.employmentTypes
        : DEFAULT_FILTERS.employmentTypes,
      salaryMax: f.salaryMax && f.salaryMax > 0 ? f.salaryMax : DEFAULT_FILTERS.salaryMax,
      states: f.states ?? [],
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

/** Admin write. The server normalises; this just posts. */
export async function saveBoardFilters(filters: BoardFilters): Promise<void> {
  await apiFetch("/api/filters", { method: "PUT", body: filters, auth: true });
}
