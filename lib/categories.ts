import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { JOB_CATEGORIES } from "./jobs";

/* Job categories are admin-editable and live in Firestore at
   settings/jobCategories { list: string[] }. The hardcoded JOB_CATEGORIES from
   lib/jobs.ts is the seed / fallback used before the doc loads (or if a read
   fails), so the job board and wizard always have a sensible list. */

const CATEGORIES_DOC = doc(db, "settings", "jobCategories");

export const DEFAULT_CATEGORIES: string[] = [...JOB_CATEGORIES];

function readList(data: unknown): string[] | null {
  const list = (data as { list?: unknown } | undefined)?.list;
  return Array.isArray(list) && list.length ? (list as string[]) : null;
}

/** One-shot read. Returns the saved list, or the defaults if none/failed. */
export async function getCategories(): Promise<string[]> {
  try {
    const snap = await getDoc(CATEGORIES_DOC);
    return (snap.exists() && readList(snap.data())) || DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/** Live subscription — fires immediately and on every change. Returns unsubscribe. */
export function subscribeCategories(cb: (list: string[]) => void): () => void {
  return onSnapshot(
    CATEGORIES_DOC,
    (snap) => cb((snap.exists() && readList(snap.data())) || DEFAULT_CATEGORIES),
    () => cb(DEFAULT_CATEGORIES),
  );
}

/** Admin write. Trims, drops blanks, de-dupes (case-insensitive), preserves order. */
export async function saveCategories(list: string[]): Promise<void> {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const raw of list) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(v);
  }
  await setDoc(CATEGORIES_DOC, { list: clean, updatedAt: Date.now() }, { merge: true });
}
