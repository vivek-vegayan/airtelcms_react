import type { CabFlag, ReassignGridRow, ReassignStage } from "../types/crqReassign.types";

/** Stage → the owner column CRQ_SP_REASSIGN_GRID pivots it into, in workflow order. */
export const STAGE_OWNER_COLUMNS: { stage: ReassignStage; key: keyof ReassignGridRow }[] = [
  { stage: "VALIDATE", key: "validate_owner" },
  { stage: "IMPACT_ANALYSIS", key: "impact_owner" },
  { stage: "MOP_CREATION", key: "mop_create_owner" },
  { stage: "MOP_VALIDATION", key: "mop_validate_owner" },
  { stage: "SCHEDULING_APPROVAL", key: "scheduling_owner" },
  { stage: "EXECUTION", key: "execution_owner" },
  { stage: "CLOSURE", key: "closure_owner" },
];

/** CRQ_STAGE_MST.stage_name, as seeded by 21_REASSIGN_SCHEMA. */
export const STAGE_NAMES: Record<ReassignStage, string> = {
  VALIDATE: "CRQ Review",
  IMPACT_ANALYSIS: "Impact Analysis",
  MOP_CREATION: "MOP Creation",
  MOP_VALIDATION: "MOP Validation",
  SCHEDULING_APPROVAL: "Scheduling & Approval",
  EXECUTION: "Network Execution",
  CLOSURE: "Task Closure",
};

/** pair_group EXEC_CLOSURE — one owner for both; the procs move them together. */
export const isPairedStage = (stage: ReassignStage | null | undefined) =>
  stage === "EXECUTION" || stage === "CLOSURE";

/**
 * Maker / checker: MOP Creation and MOP Validation must have different owners.
 * Returns the other stage's owner column for a MOP stage, else null.
 */
export const mopCounterpart = (stage: ReassignStage | null | undefined): { stage: ReassignStage; key: keyof ReassignGridRow } | null =>
  stage === "MOP_CREATION"
    ? { stage: "MOP_VALIDATION", key: "mop_validate_owner" }
    : stage === "MOP_VALIDATION"
      ? { stage: "MOP_CREATION", key: "mop_create_owner" }
      : null;

export const CAB_FLAGS: CabFlag[] = ["PENDING", "APPROVED", "REJECTED"];

/** Filter values the procs accept ("all" is sent as NULL). */
export const LEVEL_OPTIONS = ["all", "L1", "L2", "L3", "L4"];
export const SHIFT_OPTIONS = ["all", "A", "B", "G", "LG", "N"];

/** The draft batch lives for the browser tab, so a refresh keeps undo/publish working. */
const BATCH_KEY = "crqReassign.batchId";

export const batchStorage = {
  get(): string | null {
    try {
      return sessionStorage.getItem(BATCH_KEY);
    } catch {
      return null;
    }
  },
  set(batchId: string | null) {
    try {
      if (batchId) sessionStorage.setItem(BATCH_KEY, batchId);
      else sessionStorage.removeItem(BATCH_KEY);
    } catch {
      /* storage unavailable — batch simply lives in memory */
    }
  },
};

/* ── dates ─────────────────────────────────────────────────────────────── */

const p2 = (n: number) => String(n).padStart(2, "0");

/** "2026-09-24T10:30:00" | "2026-09-24 10:30:00" | "2026-09-24" → Date (local wall time). */
export const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const v = value.length === 10 ? `${value}T00:00:00` : value.replace(" ", "T");
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "HH:mm:ss" → minutes after midnight. */
export const timeToMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

export const ymd = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const todayYmd = () => ymd(new Date());

export const hm = (d: Date | null) => (d ? `${p2(d.getHours())}:${p2(d.getMinutes())}` : "—");
export const formatHm = (value: string | null | undefined) => hm(toDate(value));

/** Monday-to-Sunday week containing the anchor date. */
export const weekRange = (anchor: string) => {
  const a = parseYmd(anchor);
  const start = addDays(a, -((a.getDay() + 6) % 7));
  return { from: ymd(start), to: ymd(addDays(start, 6)) };
};

export const monthRange = (anchor: string) => {
  const a = parseYmd(anchor);
  return {
    from: ymd(new Date(a.getFullYear(), a.getMonth(), 1)),
    to: ymd(new Date(a.getFullYear(), a.getMonth() + 1, 0)),
  };
};

export const datesBetween = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let d = parseYmd(from); ymd(d) <= to; d = addDays(d, 1)) out.push(ymd(d));
  return out;
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const dowOf = (s: string) => DOW[parseYmd(s).getDay()];
export const shortDate = (s: string) => `${dowOf(s)} ${s.slice(8, 10)}`;
export const longDate = (s: string) => {
  const d = parseYmd(s);
  return `${DOW[d.getDay()]}, ${p2(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`;
};
export const rangeLabel = (from: string, to: string) => {
  const a = parseYmd(from);
  const b = parseYmd(to);
  return `${p2(a.getDate())} ${MON[a.getMonth()]} – ${p2(b.getDate())} ${MON[b.getMonth()]} ${b.getFullYear()}`;
};
export const monthLabel = (s: string) => {
  const d = parseYmd(s);
  return `${MON[d.getMonth()]} ${d.getFullYear()}`;
};

/** Pure-JS "YYYY-MM-DD HH:mm:ss" for the backend (MySQL DATETIME literal). */
export const toSqlDateTime = (d: Date): string =>
  `${ymd(d)} ${p2(d.getHours())}:${p2(d.getMinutes())}:00`;

/** Value for an <input type="datetime-local">. */
export const toLocalInput = (value: string | null | undefined): string => {
  const d = toDate(value);
  return d ? toSqlDateTime(d).slice(0, 16).replace(" ", "T") : "";
};
