import moment from "moment";
import {
  getShiftStyle,
  resolveShiftKeyFromDisplay,
} from "../../../roster/constant/shiftPalette";
import type {
  CalendarEvent,
  RosterDay,
  RosterDayMeta,
  RosterMonthStats,
} from "../types/roster.types";

/** Shift boundaries, as "HH:mm", parsed out of a "(9:30 AM - 6:30 PM)" label.
 *  The format list has to carry "h:mm A" first: on "h A" alone moment reads
 *  only the hour and silently discards the minutes, so every half-hour shift
 *  came back rounded down — a 9:30 AM – 6:30 PM shift measured as 9:00–6:00. */
const SHIFT_TIME_FORMATS = ["h:mm A", "H:mm", "h A"];

export const parseShiftTime = (shift: string) => {
  const match = shift.match(/\(([^)]+)\)/);

  if (!match) {
    return { allDay: true, start: new Date(), end: new Date() };
  }

  const [start, end] = match[1].split(" - ");

  return {
    allDay: false,
    startTime: moment(start, SHIFT_TIME_FORMATS).format("HH:mm"),
    endTime: moment(end, SHIFT_TIME_FORMATS).format("HH:mm"),
  };
};

/** Pulls the "(10:00 PM - 07:00 AM)" window out of a shiftDisplay string for
 *  tooltips/detail views — `null` for shifts with no time range (WO, H,
 *  Leave, Comp Off). Display-only: unlike `parseShiftTime`, this never
 *  rolls the end onto the next day, so it can't be used to date an event. */
export const extractShiftTimeLabel = (shiftDisplay: string): string | null => {
  const match = shiftDisplay.match(/\(([^)]+)\)/);
  return match ? match[1].replace(/\s*-\s*/, " – ") : null;
};

export const transformRosterToEvents = (
  roster: Record<string, RosterDay>,
): CalendarEvent[] => {
  return Object.entries(roster).map(([date, value], index) => {
    const shiftDisplay = value.shiftDisplay || "";
    const code = resolveShiftKeyFromDisplay(shiftDisplay);
    const workMode = value.workMode || null;

    // The roster is one entry per calendar date, so the event has to stay
    // inside that one date too — always `allDay` on its own day, never a
    // real date range. Night shifts *do* run past midnight in real time
    // (parseShiftTime rolls their end onto the next day for the dashboard's
    // hour-by-hour timeline, which genuinely needs that), but modelling
    // that rollover here made rbc treat the shift as spanning two calendar
    // days — so a night shift's tail landed as a second chip on the next
    // day's cell, stacked on top of whatever that day was separately
    // rostered. The precise time range still reaches tooltips/detail views
    // via `extractShiftTimeLabel(shiftDisplay)`, just not through the
    // event's start/end.
    return {
      id: `${date}-${index}`,
      title: code,
      start: new Date(date),
      end: new Date(date),
      allDay: true,
      resource: {
        code,
        label: getShiftStyle(code).label,
        workMode,
        shiftDisplay,
        assignActCount: value.assignActCount ?? 0,
        availableMins: value.availableMins ?? 0,
        dateKey: date,
      },
    };
  });
};

/** Shift codes that count as an actual working day in the month roll-up. */
const WORKING_CODES = new Set(["G", "LG", "A", "B", "N", "NJ"]);

/**
 * Flattens the API's day map into the per-day facts the calendar chrome
 * needs. Keys stay exactly as the API sent them (`YYYY-MM-DD`).
 */
export const buildDayMetaMap = (
  roster: Record<string, RosterDay> | undefined,
): Map<string, RosterDayMeta> => {
  const map = new Map<string, RosterDayMeta>();
  if (!roster) return map;

  for (const [dateKey, value] of Object.entries(roster)) {
    const shiftDisplay = value.shiftDisplay || "";
    const code = resolveShiftKeyFromDisplay(shiftDisplay);
    const assignActCount = value.assignActCount ?? 0;

    map.set(dateKey, {
      dateKey,
      code,
      label: getShiftStyle(code).label,
      shiftDisplay,
      workMode: value.workMode || null,
      assignActCount,
      availableMins: value.availableMins ?? 0,
      isHoliday: code === "H",
      isLeave: code === "L",
      isWeekOff: code === "W",
      isWorking: WORKING_CODES.has(code),
      isBusy: assignActCount > 0,
    });
  }

  return map;
};

/** Month roll-up for the summary strip — a single pass over the day map. */
export const buildMonthStats = (
  dayMeta: Map<string, RosterDayMeta>,
): RosterMonthStats => {
  const stats: RosterMonthStats = {
    working: 0,
    weekOff: 0,
    leave: 0,
    holiday: 0,
    compOff: 0,
    activities: 0,
    availableHours: 0,
  };

  let availableMins = 0;

  for (const day of dayMeta.values()) {
    if (day.isWorking) stats.working += 1;
    else if (day.isWeekOff) stats.weekOff += 1;
    else if (day.isLeave) stats.leave += 1;
    else if (day.isHoliday) stats.holiday += 1;
    else if (day.code === "C") stats.compOff += 1;

    stats.activities += day.assignActCount;
    availableMins += day.availableMins;
  }

  stats.availableHours = Math.round(availableMins / 60);
  return stats;
};
