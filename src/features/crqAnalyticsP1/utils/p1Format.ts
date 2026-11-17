import dayjs from "dayjs";
import type { P1StepDto } from "../types/crqAnalyticsP1.types";

export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

const SQL_DATE_TIME = "YYYY-MM-DD HH:mm:ss";

/** null / undefined / "" -> 0. Counts arrive from SQL SUM()s and can be null. */
export const num = (v: number | string | null | undefined): number => Number(v) || 0;
export const sumBy = <T,>(rows: readonly T[], pick: (r: T) => number | null | undefined): number =>
  rows.reduce((s, r) => s + num(pick(r)), 0);
export const fmtN = (v: number | null | undefined): string =>
  v == null ? "–" : Math.round(v).toLocaleString("en-IN");
export const pct = (a: number | null | undefined, b: number | null | undefined): number =>
  num(b) ? Math.round((num(a) / num(b)) * 100) : 0;
/** Hours: one decimal under 10, whole above; 0 shows as a dash. */
export const h1 = (v: number | null | undefined): string => {
  const x = num(v);
  if (!x) return "–";
  return x >= 10 ? String(Math.round(x)) : String(Math.round(x * 10) / 10);
};
export const dur = (mins: number | null | undefined): string => {
  if (mins == null || Number.isNaN(mins)) return "—";
  const m = Math.round(mins);
  if (m < 60) return `${m} min`;
  if (m < 48 * 60) return `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
  return `${Math.round(m / 144) / 10} days`;
};

/* Times travel as IST text; the browser is assumed to be on IST like the rest of the app. */
export const toSql = (ms: number): string => dayjs(ms).format(SQL_DATE_TIME);
export const parseDT = (v: string | null | undefined): number | null => {
  if (!v) return null;
  const d = dayjs(v.replace("T", " "));
  return d.isValid() ? d.valueOf() : null;
};
export const ymd = (ms: number): string => dayjs(ms).format("YYYY-MM-DD");
export const hm = (ms: number): string => dayjs(ms).format("HH:mm");
export const dmon = (ms: number): string => dayjs(ms).format("DD MMM");
export const ddmon = (ms: number): string => dayjs(ms).format("ddd DD MMM");
export const dmonhm = (ms: number): string => dayjs(ms).format("DD MMM, HH:mm");
/** A server date / date-time as "Mon 17 Nov". */
export const dayLabel = (v: string | null | undefined): string => {
  const t = parseDT(v);
  return t == null ? "—" : ddmon(t);
};
export const fdt = (v: string | null | undefined): string => {
  const t = parseDT(v);
  return t == null ? "—" : dmonhm(t);
};
export const minuteFloor = (ms: number): number => Math.floor(ms / MIN) * MIN;

/* ── Stages (CRQ_STAGE_MST order; CCB = 1-4, SE = 5-7) ───────────────── */
export type P1SideCode = "CCB" | "SE";
export interface P1StageMeta {
  no: number;
  code: string;
  label: string;
  side: P1SideCode;
}
export const STAGES: readonly P1StageMeta[] = [
  { no: 1, code: "VALIDATE", label: "CRQ Review", side: "CCB" },
  { no: 2, code: "IMPACT_ANALYSIS", label: "Impact Analysis", side: "CCB" },
  { no: 3, code: "MOP_CREATION", label: "MOP Creation", side: "CCB" },
  { no: 4, code: "MOP_VALIDATION", label: "MOP Validation", side: "CCB" },
  { no: 5, code: "SCHEDULING_APPROVAL", label: "Scheduling of Activity", side: "SE" },
  { no: 6, code: "EXECUTION", label: "Execution", side: "SE" },
  { no: 7, code: "CLOSURE", label: "Closure", side: "SE" },
];
export const stageByCode = (code: string | null | undefined): P1StageMeta | undefined =>
  STAGES.find((s) => s.code === code);
export const stageCodesOfSide = (side: P1SideCode): string =>
  STAGES.filter((s) => s.side === side)
    .map((s) => s.code)
    .join(",");

/* ── Months window used by the "last N months" cards ─────────────────── */
export interface MonthSlot {
  key: string;
  label: string;
  tip: string;
}
export const monthSlots = (months: number, now: number): MonthSlot[] => {
  const first = dayjs(now).startOf("month").subtract(months - 1, "month");
  return Array.from({ length: months }, (_, i) => {
    const d = first.add(i, "month");
    return { key: d.format("YYYY-MM"), label: d.format("MMM-YY"), tip: d.format("MMM YYYY") };
  });
};

/* ── Step labels (4-hour block / day / week / month) ─────────────────── */
export interface StepInfo {
  labels: string[];
  tips: string[];
  unit: string;
}
export const stepInfo = (rows: readonly P1StepDto[]): StepInfo => {
  if (!rows.length) return { labels: [], tips: [], unit: "Day" };
  const step = rows[0].step;
  const start = (r: P1StepDto) => parseDT(r.bucketStart) ?? 0;
  const end = (r: P1StepDto) => parseDT(r.bucketEnd) ?? 0;
  const spansYears = dayjs(start(rows[0])).year() !== dayjs(start(rows[rows.length - 1])).year();
  const yy = (t: number) => (spansYears ? ` ${dayjs(t).format("YY")}` : "");
  const label = (r: P1StepDto) => {
    const t = start(r);
    if (step === "H4") return hm(t);
    if (step === "DAY") return dmon(t) + yy(t);
    if (step === "WEEK") {
      // Monday of that week (the first step is clipped to the range start).
      const monday = dayjs(t)
        .subtract((dayjs(t).day() + 6) % 7, "day")
        .valueOf();
      return `w/c ${dmon(monday)}${yy(monday)}`;
    }
    return dayjs(t).format("MMM-YY");
  };
  const tip = (r: P1StepDto) => {
    const a = start(r);
    const b = end(r);
    if (step === "H4") return `${dmonhm(a)} – ${hm(b)}`;
    if (step === "DAY") return ddmon(a);
    return `${ddmon(a)} – ${ddmon(b - MIN)}`;
  };
  return {
    labels: rows.map(label),
    tips: rows.map(tip),
    unit: { H4: "4-hour block", DAY: "Day", WEEK: "Week", MONTH: "Month" }[step],
  };
};
