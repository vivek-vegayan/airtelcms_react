import { useCallback, useEffect, useState } from "react";

const FAVORITES_KEY = "chm.nav.favorites";
const RECENTS_KEY = "chm.nav.recents";
const MAX_RECENTS = 5;

function readList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Client-only favorites/recents for the sidebar, keyed by nav `to` path.
 * Callers are responsible for resolving stored paths back to a real
 * NavItem (label/icon) from the already permission-filtered sidebar list —
 * this hook only ever stores/returns path strings, so a favorite/recent
 * for a module the user has since lost access to simply won't resolve to
 * anything and silently disappears, never bypassing RBAC.
 */
export function useNavHistory(currentNavPath: string | undefined) {
  const [favorites, setFavorites] = useState<string[]>(() => readList(FAVORITES_KEY));
  const [recents, setRecents] = useState<string[]>(() => readList(RECENTS_KEY));

  useEffect(() => {
    if (!currentNavPath) return;
    setRecents((prev) => {
      const next = [currentNavPath, ...prev.filter((p) => p !== currentNavPath)].slice(0, MAX_RECENTS);
      writeList(RECENTS_KEY, next);
      return next;
    });
  }, [currentNavPath]);

  const toggleFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      writeList(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((path: string) => favorites.includes(path), [favorites]);

  return { favorites, recents, toggleFavorite, isFavorite };
}
