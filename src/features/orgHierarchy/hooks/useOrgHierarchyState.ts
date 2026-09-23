import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { applyOrgFilterChange } from "../config/orgFilterDependency";
import {
  resetOrgFilters,
  setOrgFilter,
  setOrgFilters,
  type OrgFilterScope,
} from "../slices/orgFilters.slice";
import type {
  OrgFilterKey,
  OrgFilterValues,
} from "../types/orgHierarchy.types";

/**
 * Stable empty object. Returning a fresh `{}` when a scope has nothing stored
 * would give `values` a new identity on every render, and useOrgHierarchyFilters
 * memoises its option lists on exactly that reference.
 */
const EMPTY: OrgFilterValues = {};

/**
 * Org-hierarchy picker state for one screen.
 *
 * Pass a `scope` and the selection is kept in Redux under that key, so leaving
 * the route and coming back re-opens on the same Vertical/Function/Domain/Sub
 * Domain instead of a blank bar. Omit it - dialogs, wizards, any picker that
 * must start clean - and the state stays local to the component exactly as
 * before.
 *
 * What is stored is only the four selected ids; the option lists themselves
 * stay in the RTK Query cache and are never duplicated here. The whole slice is
 * dropped on logout by the root reducer, and by design it never survives a
 * full page reload - a hard refresh is the user asking for a clean screen.
 */
export const useOrgHierarchyState = (
  scope?: OrgFilterScope,
  initial: OrgFilterValues = EMPTY,
) => {
  const dispatch = useAppDispatch();

  // Both hooks always run - `scope` is a constant per call site, so only the
  // value read below branches, never the hook order.
  const persisted = useAppSelector((s) =>
    scope ? s.orgFilters.byScope[scope] : undefined,
  );
  const [local, setLocal] = useState<OrgFilterValues>(initial);

  const values = scope ? (persisted ?? initial) : local;

  // A scoped screen opened for the first time with a non-empty `initial` seeds
  // the store once, so the first change cascades from those values instead of
  // silently dropping them.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (scope && !persisted && Object.keys(initial).length > 0) {
      dispatch(setOrgFilters({ scope, values: initial }));
    }
    // Mount-only on purpose: this is a seed, not a sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback(
    (key: OrgFilterKey, value?: number) => {
      if (scope) {
        dispatch(setOrgFilter({ scope, key, value }));
        return;
      }
      setLocal((prev) => applyOrgFilterChange(prev, key, value));
    },
    [dispatch, scope],
  );

  const setValues = useCallback(
    (next: OrgFilterValues) => {
      if (scope) {
        dispatch(setOrgFilters({ scope, values: next }));
        return;
      }
      setLocal(next);
    },
    [dispatch, scope],
  );

  const resetAll = useCallback(() => {
    if (scope) {
      dispatch(resetOrgFilters(scope));
      return;
    }
    setLocal(EMPTY);
  }, [dispatch, scope]);

  return {
    values,
    setValues,
    handleChange,
    resetAll,
  };
};
