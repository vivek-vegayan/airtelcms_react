import type { ReassignTimelineRow } from "../types/crqReassign.types";
import { orDash } from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { addDays, hm, parseYmd, timeToMinutes, toDate, ymd } from "./crqReassign.utils";

// Turns the flat CRQ_SP_REASSIGN_TIMELINE rows (engineer × shift day, one row
// per placed activity) into engineers with their roster days and blocks, and
// cuts those blocks into per-date segments for the week / month / day views.

export interface TimeBlock {
  key: string;
  row: ReassignTimelineRow;
  crqNo: string;
  olmid: string;
  start: Date;
  end: Date;
}

export interface TimelineEngineer {
  olmid: string;
  name: string;
  level: string | null;
  team: string | null;
  /** Roster row per shift_date. */
  roster: Map<string, ReassignTimelineRow>;
  blocks: TimeBlock[];
}

export interface Segment {
  key: string;
  block: TimeBlock;
  /** Fractional hours from 00:00 of the date. */
  startH: number;
  endH: number;
  /** Started on an earlier date. */
  cont: boolean;
  /** Runs past 24:00 into the next date. */
  overnight: boolean;
}

const HOUR = 3_600_000;

export const buildEngineers = (rows: ReassignTimelineRow[], from: string, to: string): TimelineEngineer[] => {
  const rangeStart = parseYmd(from).getTime();
  const rangeEnd = addDays(parseYmd(to), 1).getTime();
  const map = new Map<string, TimelineEngineer & { inRange: boolean }>();

  for (const r of rows) {
    let e = map.get(r.olmid);
    if (!e) {
      e = { olmid: r.olmid, name: r.employee_name, level: r.job_level, team: r.team_name, roster: new Map(), blocks: [], inRange: false };
      map.set(r.olmid, e);
    }
    if (!e.roster.has(r.shift_date)) e.roster.set(r.shift_date, r);
    if (r.shift_date >= from && r.shift_date <= to) e.inRange = true;

    const start = toDate(r.block_start);
    const end = toDate(r.block_end);
    if (r.crq_no && r.Schedule_ID != null && start && end && !e.blocks.some((b) => b.row.Schedule_ID === r.Schedule_ID)) {
      e.blocks.push({ key: String(r.Schedule_ID), row: r, crqNo: r.crq_no, olmid: r.olmid, start, end });
      if (start.getTime() < rangeEnd && end.getTime() > rangeStart) e.inRange = true;
    }
  }
  // The query reaches one day back for overnight carry-overs; engineers seen
  // only on that day are not part of the range.
  return [...map.values()].filter((e) => e.inRange);
};

export const segmentsOn = (eng: TimelineEngineer, date: string): Segment[] => {
  const dayStart = parseYmd(date);
  const dayEnd = addDays(dayStart, 1);
  const out: Segment[] = [];
  for (const b of eng.blocks) {
    if (b.end <= dayStart || b.start >= dayEnd) continue;
    const cont = b.start < dayStart;
    out.push({
      key: `${b.key}-${date}`,
      block: b,
      cont,
      overnight: b.end > dayEnd,
      startH: cont ? 0 : (b.start.getTime() - dayStart.getTime()) / HOUR,
      endH: Math.min(24, (b.end.getTime() - dayStart.getTime()) / HOUR),
    });
  }
  return out.sort((a, b) => a.startH - b.startH);
};

/** Roster row whose activity window falls on this date (night shifts sit on the next day). */
export const rosterOn = (eng: TimelineEngineer, date: string) => {
  for (const r of eng.roster.values()) if ((r.work_date ?? r.shift_date) === date) return r;
  return eng.roster.get(date) ?? null;
};

/** True when hour h of the day lies inside the roster's activity window. */
export const inActivityWindow = (roster: ReassignTimelineRow | null, h: number) => {
  if (!roster) return false;
  const s = timeToMinutes(roster.activity_start);
  const e = timeToMinutes(roster.activity_end);
  if (s == null || e == null) return false;
  const hs = h * 60;
  const he = hs + 60;
  return e > s ? he > s && hs < e : he > s || hs < e;
};

/** Tooltip rows for one placed activity. */
export const blockDetails = (s: Segment): [string, string][] => {
  const r = s.block.row;
  return [
    ["Plan", orDash(r.Plan_Id)],
    ["Task", orDash(r.Task_Id)],
    ["Window", `${ymd(s.block.start)} ${hm(s.block.start)} – ${ymd(s.block.end)} ${hm(s.block.end)}`],
    ["Reserved", r.Reserved_Minutes != null ? `${r.Reserved_Minutes} min` : "—"],
    ["State", orDash(r.Reservation_State)],
    ["Assignment", orDash(r.assign_status)],
  ];
};
