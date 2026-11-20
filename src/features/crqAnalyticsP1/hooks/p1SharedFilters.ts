import { useCallback, useSyncExternalStore } from "react";
import dayjs from "dayjs";
import type { QuickDateFilter } from "../../crqAnalytics/utils/dateRange";
import type { P1Side } from "../types/crqAnalyticsP1.types";

/*
 * One filter + date-range selection shared by the Summary, Pendency and Teams & people tabs, so a
 * filter picked on one tab is already selected when another tab opens. It lives for the browser
 * session of the page (a full reload starts fresh). Each tab still sends only the filters it uses.
 */

export interface P1FilterValues {
  vertical: string;
  side: P1Side;
  domain: string;
  subDomain: string;
  stage: string;
  circle: string;
}

export const EMPTY_FILTERS: P1FilterValues = { vertical: "", side: "", domain: "", subDomain: "", stage: "", circle: "" };

export interface P1SharedSelection {
  values: P1FilterValues;
  quickFilter: QuickDateFilter;
  /** Custom range days as YYYY-MM-DD (kept as text so the store holds plain values). */
  customStart: string;
  customEnd: string;
}

let selection: P1SharedSelection = {
  values: EMPTY_FILTERS,
  quickFilter: "1w",
  customStart: dayjs().subtract(14, "day").format("YYYY-MM-DD"),
  customEnd: dayjs().format("YYYY-MM-DD"),
};
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => selection;

/** The shared selection and an updater (takes the previous selection, returns the next one). */
export function useP1SharedSelection() {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  const update = useCallback((next: (prev: P1SharedSelection) => P1SharedSelection) => {
    selection = next(selection);
    listeners.forEach((l) => l());
  }, []);
  return [current, update] as const;
}
