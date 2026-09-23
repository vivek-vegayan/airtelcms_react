import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { applyOrgFilterChange } from "../config/orgFilterDependency";
import type {
  OrgFilterKey,
  OrgFilterValues,
} from "../types/orgHierarchy.types";

/**
 * Every screen that should remember the org scope the user picked, named once
 * here. It is a closed union rather than a free string on purpose:
 *
 * - it bounds what this slice can ever hold (one <=4-number object per entry,
 *   ~11 entries - a few hundred bytes for the whole tree), so no amount of
 *   navigating can grow it;
 * - two screens can deliberately share a memory by sharing a scope, and a typo
 *   can't silently create a third, orphaned one.
 *
 * Transient pickers - the ones inside Add Member / Add User / assignment
 * dialogs - are deliberately absent. They must open blank every time, so they
 * call useOrgHierarchyState() with no scope and stay on local state.
 */
export type OrgFilterScope =
  | "schedulerWorkflow"
  | "cancelledCrq"
  | "planViewAndSetup"
  | "taskConfig"
  | "rosterView"
  | "rosterGeneration"
  | "cabPlanning"
  | "crqJourney"
  | "crqDetails"
  | "crqAnalytics"
  | "userLogs";

interface OrgFiltersState {
  /** Absent scope = never touched this session; the screen opens blank. */
  byScope: Partial<Record<OrgFilterScope, OrgFilterValues>>;
}

const initialState: OrgFiltersState = { byScope: {} };

const orgFiltersSlice = createSlice({
  name: "orgFilters",
  initialState,
  reducers: {
    /** One picker changed - stored with the same cascade the local path uses. */
    setOrgFilter(
      state,
      action: PayloadAction<{
        scope: OrgFilterScope;
        key: OrgFilterKey;
        value?: number;
      }>,
    ) {
      const { scope, key, value } = action.payload;
      state.byScope[scope] = applyOrgFilterChange(
        state.byScope[scope] ?? {},
        key,
        value,
      );
    },

    /** Whole scope replaced at once - e.g. Global CRQ Search jumping scope. */
    setOrgFilters(
      state,
      action: PayloadAction<{ scope: OrgFilterScope; values: OrgFilterValues }>,
    ) {
      state.byScope[action.payload.scope] = action.payload.values;
    },

    /**
     * "Clear filters". The entry is deleted rather than set to {} so a cleared
     * screen costs nothing to remember.
     */
    resetOrgFilters(state, action: PayloadAction<OrgFilterScope>) {
      delete state.byScope[action.payload];
    },
  },
});

export const { setOrgFilter, setOrgFilters, resetOrgFilters } =
  orgFiltersSlice.actions;

export default orgFiltersSlice.reducer;
