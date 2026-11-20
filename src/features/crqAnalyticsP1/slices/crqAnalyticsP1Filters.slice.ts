import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import dayjs from "dayjs";
import type { QuickDateFilter } from "../../crqAnalytics/utils/dateRange";
import type { P1Side } from "../types/crqAnalyticsP1.types";
import { STAGES } from "../utils/p1Format";

/**
 * Filters and date range of the CRQ Analytics tabs (Summary, Pendency, Teams & people), shared by
 * all three so a filter picked on one tab is already selected on the others. Same rules as the
 * orgFilters slice: dropped on logout by the root reducer, and not kept after a full page reload.
 *
 * Domain / Team values are CSV id lists: the dropdowns show each name once and a name can stand
 * for several org records ("Optics" = 4,19,21,27). The procedures take CSV ids.
 */
export interface P1FilterValues {
  vertical: string;
  side: P1Side;
  domain: string;
  subDomain: string;
  stage: string;
  circle: string;
}

export type P1FilterKey = keyof P1FilterValues;

export const EMPTY_FILTERS: P1FilterValues = { vertical: "", side: "", domain: "", subDomain: "", stage: "", circle: "" };

interface CrqAnalyticsP1FiltersState {
  values: P1FilterValues;
  quickFilter: QuickDateFilter;
  /** Custom range days as YYYY-MM-DD (plain text keeps the state serializable). */
  customStart: string;
  customEnd: string;
}

const initialState: CrqAnalyticsP1FiltersState = {
  values: EMPTY_FILTERS,
  quickFilter: "1w",
  customStart: dayjs().subtract(14, "day").format("YYYY-MM-DD"),
  customEnd: dayjs().format("YYYY-MM-DD"),
};

const crqAnalyticsP1FiltersSlice = createSlice({
  name: "crqAnalyticsP1Filters",
  initialState,
  reducers: {
    /** One dropdown changed. A narrower parent clears the children that may no longer belong to it. */
    setP1Filter(state, action: PayloadAction<{ key: P1FilterKey; value: string }>) {
      const { key, value } = action.payload;
      const next = { ...state.values, [key]: value } as P1FilterValues;
      if (key === "vertical") {
        next.domain = "";
        next.subDomain = "";
      }
      if (key === "domain") next.subDomain = "";
      if (key === "side" && value && next.stage && !STAGES.some((s) => s.code === next.stage && s.side === value)) {
        next.stage = "";
      }
      state.values = next;
    },

    /** "Clear filters" (the date range is kept). */
    resetP1Filters(state) {
      state.values = EMPTY_FILTERS;
    },

    setP1QuickFilter(state, action: PayloadAction<QuickDateFilter>) {
      state.quickFilter = action.payload;
    },

    /** Custom range days as YYYY-MM-DD, "" when cleared. */
    setP1CustomStart(state, action: PayloadAction<string>) {
      state.customStart = action.payload;
    },
    setP1CustomEnd(state, action: PayloadAction<string>) {
      state.customEnd = action.payload;
    },
  },
});

export const { setP1Filter, resetP1Filters, setP1QuickFilter, setP1CustomStart, setP1CustomEnd } = crqAnalyticsP1FiltersSlice.actions;
export default crqAnalyticsP1FiltersSlice.reducer;
