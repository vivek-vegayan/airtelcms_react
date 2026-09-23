import { addDays, format, isSameDay } from "date-fns";
import { parseShiftTime } from "../../userMe/userRoster/utils/rosterTransform";
import { getShiftColors } from "../../userMe/userRoster/constants/shiftColors";
import type { RosterDay } from "../../userMe/userRoster/types/roster.types";
import type { WeekDay } from "../types/dashboard.types";

const OFF_LABELS: Record<string, string> = {
  WO: "Week off",
  H: "Holiday",
  Leave: "On leave",
};

const DAY_LABELS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function buildDay(date: Date, rosterDay: RosterDay | undefined, today: Date): WeekDay {
  const base: WeekDay = {
    day: DAY_LABELS[date.getDay()],
    date: date.getDate(),
    shift: null,
    isToday: isSameDay(date, today),
  };

  if (!rosterDay) {
    return { ...base, isOff: true };
  }

  const shiftDisplay = rosterDay.shiftDisplay || "";
  const parsed = parseShiftTime(shiftDisplay);
  const code = shiftDisplay.split("(")[0].trim();

  if (!("startTime" in parsed)) {
    return { ...base, isOff: true, offLabel: OFF_LABELS[code] ?? (code || "Off") };
  }

  const startTime = parsed.startTime ?? "";
  const endTime = parsed.endTime ?? "";

  return {
    ...base,
    shift: {
      name: code,
      start: startTime,
      end: endTime,
      dur: `${rosterDay.availableMins}m`,
      code,
      colors: getShiftColors(shiftDisplay),
      workMode: rosterDay.workMode === "WFH" || rosterDay.workMode === "WFO" ? rosterDay.workMode : null,
    },
  };
}

/** Builds the dashboard's WeekDay[] grid for one week from the roster API response. */
export function buildWeekDays(params: {
  weekStart: Date;
  roster?: Record<string, RosterDay>;
  today?: Date;
}): WeekDay[] {
  const { weekStart, roster, today = new Date() } = params;

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateKey = format(date, "yyyy-MM-dd");
    return buildDay(date, roster?.[dateKey], today);
  });
}

/** e.g. "Jul 19 – Jul 25, 2026" */
export function formatWeekRangeLabel(weekStart: Date, weekEnd: Date): string {
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startLabel = format(weekStart, sameMonth ? "MMM d" : "MMM d");
  const endLabel = format(weekEnd, "MMM d, yyyy");
  return `${startLabel} – ${endLabel}`;
}
