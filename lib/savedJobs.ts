"use client";

import { useCallback, useEffect, useState } from "react";

/* "Save position" bookmarks — device-local (no account needed to save a
   role for later), shared between the jobs board and a job's detail page via
   localStorage rather than each keeping its own throwaway component state. */

const KEY = "jobfolder_saved_jobs";

function readSaved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function useSavedJobs() {
  const [saved, setSaved] = useState<Set<string>>(() => readSaved());

  // Pick up saves made in another tab.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setSaved(readSaved());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable (private browsing, quota) — keep the in-memory toggle */
      }
      return next;
    });
  }, []);

  return { saved, toggle };
}
