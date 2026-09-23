import { useCallback, useState } from "react";

const STORAGE_KEY = "chm.recentSearches";
const MAX_ENTRIES = 5;

export interface RecentSearchEntry {
  id: string;
  label: string;
  path: string;
}

function readRecent(): RecentSearchEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentSearchEntry[]) : [];
  } catch {
    return [];
  }
}

function writeRecent(entries: RecentSearchEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<RecentSearchEntry[]>(readRecent);

  const addRecent = useCallback((entry: RecentSearchEntry) => {
    setRecent((prev) => {
      const next = [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES);
      writeRecent(next);
      return next;
    });
  }, []);

  return { recent, addRecent };
}
