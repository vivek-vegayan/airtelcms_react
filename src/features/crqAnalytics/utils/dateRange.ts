import dayjs, { type Dayjs } from "dayjs";

export type QuickDateFilter = "24h" | "1w" | "30d" | "custom";

export const QUICK_DATE_OPTIONS: { value: QuickDateFilter; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "1w", label: "1 Week" },
  { value: "30d", label: "30 Days" },
  { value: "custom", label: "Custom" },
];

const ISO_DATE = "YYYY-MM-DD";

/** Resolves a quick filter to a concrete [startDate, endDate] ISO pair; "custom" is resolved by the caller. */
export function resolveQuickRange(filter: QuickDateFilter): { startDate: string; endDate: string } {
  const end = dayjs();
  const daysBack = filter === "24h" ? 1 : filter === "1w" ? 7 : 30;
  const start = end.subtract(daysBack, "day");
  return { startDate: start.format(ISO_DATE), endDate: end.format(ISO_DATE) };
}

export function toIsoDate(d: Dayjs | null): string | null {
  return d && d.isValid() ? d.format(ISO_DATE) : null;
}
