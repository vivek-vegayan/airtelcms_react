import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { api } from "../service/api";

/** One of the cache tag types declared on the root api slice. */
export type ApiTag = Parameters<typeof api.util.invalidateTags>[0][number];

interface Options {
  /**
   * Cache tags to invalidate. Every *mounted* query providing one of them
   * refetches - which is how a filter-bar button can refresh data owned by a
   * child component without prop-drilling a refetch through it.
   *
   * Pass a module-level constant, not an inline literal, so `refresh` keeps a
   * stable identity across renders.
   */
  tags?: ApiTag[];
  /** Extra work: an owned query's refetch(), a lazy-query re-trigger, ... */
  onRefresh?: () => void;
  /** The screen's own loading flag, so the icon spins until data actually lands. */
  isFetching?: boolean;
}

/**
 * Minimum time the icon keeps spinning. Tag invalidation is fire-and-forget -
 * without a floor, a warm response makes the button flicker and the user cannot
 * tell whether the click registered.
 */
const MIN_SPIN_MS = 600;

/** Backs the refresh button on the org-hierarchy filter bars. */
export function useApiRefresh({ tags, onRefresh, isFetching = false }: Options = {}) {
  const dispatch = useAppDispatch();
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const refresh = useCallback(() => {
    if (tags?.length) dispatch(api.util.invalidateTags(tags));
    onRefresh?.();

    setSpinning(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSpinning(false), MIN_SPIN_MS);
  }, [dispatch, tags, onRefresh]);

  return { refresh, isRefreshing: spinning || isFetching };
}
