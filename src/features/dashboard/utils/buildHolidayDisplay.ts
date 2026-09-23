import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Holiday, ToneKey, UpcomingHolidayRow } from "../types/dashboard.types";

function toneForDaysAway(days: number): ToneKey {
  if (days <= 3) return "danger";
  if (days <= 7) return "warning";
  if (days <= 14) return "info";
  return "accent";
}

function formatCountdown(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

/** Maps /dashboard/upcomingholidays rows into the UpcomingHolidaysCard display shape. */
export function buildHolidayDisplay(rows: readonly UpcomingHolidayRow[], today: Date = new Date()): Holiday[] {
  return rows.map((row) => {
    const date = parseISO(row.holidayDate);
    const days = differenceInCalendarDays(date, today);
    return {
      month: format(date, "MMM").toUpperCase(),
      day: format(date, "d"),
      name: row.holidayOccasion,
      type: row.holidayDay,
      countdown: formatCountdown(days),
      tone: toneForDaysAway(days),
    };
  });
}
