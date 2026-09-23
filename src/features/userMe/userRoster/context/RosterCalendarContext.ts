import { createContext, useContext } from "react";
import type { CalendarTokens } from "../constants/calendarTokens";
import type { RosterDayMeta } from "../types/roster.types";

/**
 * react-big-calendar memoises the `components` prop by identity — handing it
 * a fresh object remounts the whole grid on every render. So the custom cell
 * renderers are module-level constants and pull the per-day data they need
 * from this context instead of from props.
 */
export interface RosterCalendarValue {
  /** `YYYY-MM-DD` → the day's roster facts. Empty when there is no data. */
  dayMeta: Map<string, RosterDayMeta>;
  /** `YYYY-MM-DD` of the user's currently selected day, or null. */
  selectedKey: string | null;
  /** `YYYY-MM-DD` of today, resolved once per mount. */
  todayKey: string;
  tokens: CalendarTokens;
}

export const RosterCalendarContext = createContext<RosterCalendarValue | null>(
  null,
);

export const useRosterCalendar = (): RosterCalendarValue => {
  const value = useContext(RosterCalendarContext);
  if (!value) {
    throw new Error(
      "useRosterCalendar must be used inside <RosterCalendarContext.Provider>",
    );
  }
  return value;
};

/** Local-time `YYYY-MM-DD` key — matches the grid's own day boundaries. */
export const toDateKey = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
