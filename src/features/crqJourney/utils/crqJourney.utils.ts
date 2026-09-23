import { alpha } from "@mui/material/styles";
import type {
  StepStatus,
  ApprovalStatus,
  ApprovalIconKey,
  CrqJourneyStageRow,
  CrqJourneyFlow,
  CrqPendingApproval,
  CrqApproverLevel,
  ApproverLevelKey,
  ApproverLevelView,
  PendingApprovalView,
  CrqServiceSpoc,
  ServiceRosterRow,
  ServiceSpocContact,
  CrqDetailsStage,
} from "../types/crqJourney.types";

// ─── Shared status hues ────────────────────────────────────────────────────────
// Single source of truth for each status color so every card/badge/canvas in
// this feature stays in sync, and so light vs. dark variants never drift.
// `dark`/`light` are the readable text/icon colors for that mode; `base` is the
// saturated hue used to derive dim fills and borders via alpha().
const HUE = {
  green:  { base: "#16A34A", light: "#5DCAA5", dark: "#15803D" },
  blue:   { base: "#1976D2", light: "#7FB4EE", dark: "#1565C0" },
  orange: { base: "#ED8B00", light: "#FAC775", dark: "#B45309" },
  red:    { base: "#DC2626", light: "#F09595", dark: "#B91C1C" },
  purple: { base: "#7C3AED", light: "#C4A6F5", dark: "#6D28D9" },
  grey:   { base: "#64748B", light: "#94A3B8", dark: "#475569" },
} as const;

const tone = (hue: (typeof HUE)[keyof typeof HUE], isDark: boolean) => ({
  color: isDark ? hue.light : hue.dark,
  borderColor: alpha(hue.base, isDark ? 0.4 : 0.28),
  fill: alpha(hue.base, isDark ? 0.18 : 0.09),
});

// ─── Step status visual config ────────────────────────────────────────────────
export const getStepStatusConfig = (
  isDark: boolean
): Record<StepStatus, { label: string; color: string; borderColor: string; bgColor: string }> => ({
  completed:   { label: "Completed",   ...remap(tone(HUE.green, isDark)) },
  in_progress: { label: "In Progress", ...remap(tone(HUE.blue, isDark)) },
  pending:     { label: "Pending",     ...remap(tone(HUE.orange, isDark)) },
  not_started: { label: "Not Started", ...remap(tone(HUE.grey, isDark)) },
  cancelled:   { label: "Cancelled",   ...remap(tone(HUE.red, isDark)) },
});

function remap(t: { color: string; borderColor: string; fill: string }) {
  return { color: t.color, borderColor: t.borderColor, bgColor: t.fill };
}

// ─── Approval status visual config ───────────────────────────────────────────
export const getApprovalStatusConfig = (
  isDark: boolean
): Record<ApprovalStatus, { label: string; color: string; borderColor: string; iconBg: string }> => ({
  approved: { label: "Approved", color: tone(HUE.green, isDark).color, borderColor: tone(HUE.green, isDark).borderColor, iconBg: tone(HUE.green, isDark).fill },
  pending:  { label: "Pending",  color: tone(HUE.orange, isDark).color, borderColor: tone(HUE.orange, isDark).borderColor, iconBg: tone(HUE.orange, isDark).fill },
  rejected: { label: "Rejected", color: tone(HUE.red, isDark).color, borderColor: tone(HUE.red, isDark).borderColor, iconBg: tone(HUE.red, isDark).fill },
});

// ─── Raw backend text → visual status ─────────────────────────────────────────
// The vocabulary sp_get_crq_journey_page can emit, confirmed against the live
// routine body and against CRQ_MASTER_TBL.current_status:
//   APPROVED   — a canonical stage the CRQ has already moved past
//   STARTED    — the current stage, picked up and being worked (most common)
//   IN-PROGRESS— the current stage (underscore form, hyphenated by the proc)
//   COMPLETE   — terminal CLOSURE state
//   PENDING    — a stage the CRQ hasn't reached, or an un-actioned approval
//   CANCELLED  — the CRQ was cancelled at this stage
//   NA         — a stage after a cancellation, so it will never run
//   REJECTED   — a service approval that was turned down
//   YES / NO   — the CAB and CONFLICT CHECK rows only
// Matching stays keyword-based rather than a closed enum so an added word
// degrades to "not started" instead of throwing the canvas off.
export const normalizeStepStatus = (raw: string | null | undefined): StepStatus => {
  const s = (raw ?? "").trim().toUpperCase();
  if (s.includes("PROGRESS") || s === "STARTED") return "in_progress";
  if (["APPROVED", "COMPLETED", "DONE", "COMPLETE", "YES"].includes(s)) return "completed";
  if (s.includes("CANCEL") || s.includes("REJECT")) return "cancelled";
  if (s.includes("PENDING")) return "pending";
  return "not_started";
};

export const normalizeApprovalStatus = (raw: string | null | undefined): ApprovalStatus => {
  const s = (raw ?? "").trim().toUpperCase();
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  return "pending";
};

/** "IN-PROGRESS" → "In Progress", "Activity_Implement" → "Activity Implement" — the real backend word, just tidied up. */
export const formatStatusLabel = (raw: string | null | undefined): string => {
  const s = (raw ?? "").trim();
  if (!s) return "—";
  if (s.toUpperCase() === "NA") return "N/A";
  return s
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// ─── Stage display names ──────────────────────────────────────────────────────
// sp_get_crq_journey_page emits operational stage keys ("MOP CREATE",
// "Activity_Implement", "SCHEDULING", and — since the routine was last edited —
// "Plan & Inventory"). These are the business-facing names for them.
//
// Matched on the EXACT normalized key rather than by substring, because the
// keys overlap: "MOP VALIDATE" contains "VALIDATE", and a substring rule would
// label the MOP stage as Plan & Inventory Validation. Both the current and the
// older spellings are listed so an out-of-date database still reads correctly,
// and anything unrecognised falls back to a tidied version of the raw value.
const STAGE_DISPLAY_NAMES: Record<string, string> = {
  "SPOC/FE ASSIGNMENT": "SPOC / FE Assignment",
  "PLAN & INVENTORY": "Plan & Inventory Validation",
  "PLAN AND INVENTORY": "Plan & Inventory Validation",
  VALIDATE: "Plan & Inventory Validation",
  "IMPACT ANALYSIS": "Impact Analysis",
  "MOP CREATE": "MOP Creation",
  "MOP VALIDATE": "MOP Validation",
  SCHEDULING: "Activity Scheduling",
  ACTIVITY_IMPLEMENT: "Activity Implementation",
  "ACTIVITY IMPLEMENT": "Activity Implementation",
  IMPLEMENTATION: "Activity Implementation",
  CLOSURE: "CRQ Closure",
  CAB: "CAB",
  "CONFLICT CHECK": "Conflict Check",
};

/** Business-facing name for a workflow stage — the raw proc value stays in the card tooltip. */
export const formatStageName = (raw: string | null | undefined): string =>
  STAGE_DISPLAY_NAMES[(raw ?? "").trim().toUpperCase()] ?? formatStatusLabel(raw);

/** Color a free-text CRQ_MASTER_TBL.current_status value (many possible words — see GetCRQBySubDomainId's CASE map). */
export const statusChipColor = (
  raw: string | null | undefined,
  isDark = false
): { color: string; bg: string; dot: string } => {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("progress")) { const t = tone(HUE.blue, isDark); return { color: t.color, bg: t.fill, dot: HUE.blue.base }; }
  if (s.includes("done") || s.includes("complete") || s.includes("approved")) { const t = tone(HUE.green, isDark); return { color: t.color, bg: t.fill, dot: HUE.green.base }; }
  if (s.includes("fail") || s.includes("cancel") || s.includes("reject")) { const t = tone(HUE.red, isDark); return { color: t.color, bg: t.fill, dot: HUE.red.base }; }
  if (s.includes("pending")) { const t = tone(HUE.orange, isDark); return { color: t.color, bg: t.fill, dot: HUE.orange.base }; }
  if (s.includes("pause") || s.includes("hold")) { const t = tone(HUE.purple, isDark); return { color: t.color, bg: t.fill, dot: HUE.purple.base }; }
  const t = tone(HUE.grey, isDark);
  return { color: t.color, bg: t.fill, dot: HUE.grey.base };
};

/**
 * Connector-layer hues for the flow canvas. Same five semantic hues as the
 * cards above, but nudged brighter in dark mode so 1.8px strokes stay legible
 * against the dark paper surface.
 */
export const getFlowHues = (isDark: boolean) => ({
  green:  isDark ? "#3FBF74" : HUE.green.base,
  blue:   isDark ? "#5FA3E8" : HUE.blue.base,
  orange: isDark ? "#F0A93A" : HUE.orange.base,
  red:    isDark ? "#F07070" : HUE.red.base,
  grey:   isDark ? "#5A6C82" : "#94A3B8",
});

// ─── Approval icon guesser ────────────────────────────────────────────────────
// Approval rows are named from CRQ_CAB_SERVICE_MASTER.Service_Name, which is
// free text an admin can extend — so this is a rule list, not a lookup. Order
// matters and is load-bearing:
//   • "Mobility (RAN/Core)" must resolve as mobility, not RAN or Core
//   • "Transmission" contains the letters "ran", so transmission is tested
//     before anything matching a radio-access token
// Everything currently in the master table is covered (Radio Access Network,
// Transmission, Mobility (RAN/Core), Enterprise / B2B, Telemedia, Core
// Services), plus role-style approvers such as "NOC Head"; anything new falls
// through to a neutral icon rather than a wrong one.
const APPROVAL_ICON_RULES: ReadonlyArray<{ key: ApprovalIconKey; match: readonly string[] }> = [
  { key: "user",         match: ["noc head", "head", "manager", "approver", "owner", "spoc", "lead"] },
  { key: "transmission", match: ["transmission", "microwave", "backhaul"] },
  { key: "telemedia",    match: ["telemedia", "broadband", "dth", "tv"] },
  { key: "b2b",          match: ["b2b", "enterprise", "business"] },
  { key: "mobility",     match: ["mobility", "mobile", "2g", "3g", "4g", "5g"] },
  { key: "ran",          match: ["radio access", "radio", "ran/", "/ran"] },
  { key: "optical",      match: ["optic", "fiber", "fibre", "ofc"] },
  { key: "packet",       match: ["packet", "mpls", "ip core"] },
  { key: "security",     match: ["secur", "firewall"] },
  { key: "core",         match: ["core"] },
];

export const pickApprovalIcon = (label: string): ApprovalIconKey => {
  const s = (label ?? "").toLowerCase();
  return APPROVAL_ICON_RULES.find((r) => r.match.some((m) => s.includes(m)))?.key ?? "others";
};

// ─── Approval display name ────────────────────────────────────────────────────
// CRQ_CAB_SERVICE_MASTER stores long operational names ("Mobility (RAN/Core)",
// "Enterprise / B2B", "Radio Access Network"). An approval card in the lane is
// ~86-100px wide, so those all ellipsize to noise. This maps each to the short
// name the business actually says out loud; the untouched value still shows in
// the card's tooltip, so nothing is hidden — only shortened.
//
// Same ordering rule as the icon list: "Mobility (RAN/Core)" must resolve to
// Mobility rather than RAN or Core.
const APPROVAL_SHORT_NAMES: ReadonlyArray<{ match: readonly string[]; label: string }> = [
  { match: ["noc head"],                          label: "NOC Head" },
  { match: ["mobility"],                          label: "Mobility" },
  { match: ["b2b", "enterprise"],                 label: "B2B" },
  { match: ["telemedia"],                         label: "Telemedia" },
  { match: ["transmission"],                      label: "Transmission" },
  { match: ["radio access", "ran/", "/ran"],      label: "RAN" },
  { match: ["core service", "core network"],      label: "Core" },
  { match: ["optical", "fiber", "fibre"],         label: "Optical" },
];

/** Short, card-sized label for a service approval — falls back to the backend name verbatim. */
export const formatApprovalName = (raw: string | null | undefined): string => {
  const value = (raw ?? "").trim();
  if (!value) return "—";
  const s = value.toLowerCase();
  return APPROVAL_SHORT_NAMES.find((r) => r.match.some((m) => s.includes(m)))?.label ?? value;
};

// ─── Datetime formatting (backend LocalDateTime serializes as ISO string) ────
export const formatDateTime = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * When the CRQ entered the stage it is sitting in now.
 *
 * `CRQ_MASTER_TBL.entered_current_stage_at` only reaches the UI through
 * GetCRQBySubDomainId (the Sub Domain browse list) — result set 1 of
 * get_crq_details has no such column. Result set 2 does carry per-stage
 * timestamps, so the row flagged `Is_Current` supplies the value for a CRQ that
 * was typed straight into the selector instead of picked from that list.
 *
 * `stageStartDate` (CRQ_STAGE_ASSIGN_TBL.actual_start_time) is the stage's real
 * start; `assignStart` is the fallback for a stage that has been assigned but
 * not yet picked up. Both are null on a CRQ with no stage-assign history — a
 * common case on this dataset — so null is a legitimate answer, not a failure.
 */
export const currentStageEnteredAt = (stages: CrqDetailsStage[] | undefined): string | null => {
  const current = stages?.find((s) => s.isCurrent);
  return current?.stageStartDate ?? current?.assignStart ?? null;
};

// ─── sp_get_crq_journey_page flat rows → grouped flow (Feature 1) ────────────
//
// Every row is resolved by NAME, never by position. The routine appends its
// four blocks in a fixed order today (canonical stages → services → CAB →
// conflict check), but it has already been re-ordered and renamed once in
// place — an index-based grouper silently mis-files whole stages when that
// happens, which is exactly the failure this avoids.
//
// Each slot lists every spelling seen in the field so an older database (which
// still says VALIDATE / IMPLEMENTATION) keeps working alongside the current one
// (Plan & Inventory / Activity_Implement).
type CanonicalSlot = Exclude<keyof CrqJourneyFlow, "approvals">;

const CANONICAL_SLOTS: ReadonlyArray<{ slot: CanonicalSlot; names: readonly string[] }> = [
  { slot: "assignment",     names: ["SPOC/FE ASSIGNMENT"] },
  { slot: "validate",       names: ["PLAN & INVENTORY", "PLAN AND INVENTORY", "VALIDATE"] },
  { slot: "impactAnalysis", names: ["IMPACT ANALYSIS"] },
  { slot: "mopCreate",      names: ["MOP CREATE"] },
  { slot: "mopValidate",    names: ["MOP VALIDATE"] },
  { slot: "scheduling",     names: ["SCHEDULING"] },
  { slot: "implementation", names: ["ACTIVITY_IMPLEMENT", "ACTIVITY IMPLEMENT", "IMPLEMENTATION"] },
  { slot: "closure",        names: ["CLOSURE"] },
  { slot: "cab",            names: ["CAB"] },
  { slot: "conflictCheck",  names: ["CONFLICT CHECK"] },
];

export const groupJourneyStages = (rows: CrqJourneyStageRow[]): CrqJourneyFlow => {
  const flow: CrqJourneyFlow = {
    assignment: null,
    approvals: [],
    cab: null,
    conflictCheck: null,
    validate: null,
    impactAnalysis: null,
    mopCreate: null,
    mopValidate: null,
    scheduling: null,
    implementation: null,
    closure: null,
  };

  for (const row of rows) {
    const name = row.stage.trim().toUpperCase();
    // Only the first row claiming a slot wins; anything left over — including a
    // service that repeats, which the proc does emit — is a service approval.
    const match = CANONICAL_SLOTS.find((c) => c.names.includes(name) && flow[c.slot] === null);
    if (match) {
      flow[match.slot] = row;
    } else {
      flow.approvals.push(row);
    }
  }

  return flow;
};

/**
 * "N of M stages complete" for the header progress meter — derived purely from
 * the stage rows the proc returned (service approvals excluded: they're a
 * side-track, not part of the linear stage count).
 */
export const computeFlowProgress = (
  flow: CrqJourneyFlow
): { completed: number; total: number; pct: number; activeStage: string | null } => {
  const steps = [
    flow.assignment,
    flow.validate,
    flow.impactAnalysis,
    flow.mopCreate,
    flow.mopValidate,
    flow.scheduling,
    flow.implementation,
    flow.closure,
  ].filter((s): s is CrqJourneyStageRow => s != null);

  const total = steps.length;
  const completed = steps.filter((s) => normalizeStepStatus(s.status) === "completed").length;
  const active = steps.find((s) => normalizeStepStatus(s.status) === "in_progress");

  return {
    completed,
    total,
    pct: total ? Math.round((completed / total) * 100) : 0,
    activeStage: active ? active.stage : null,
  };
};

// ─── Service approvals (result set 2) ────────────────────────────────────────
//
// sp_get_crq_journey_page is read-only for this feature, so everything the UI
// needs beyond its raw columns is derived here:
//
//   • result set 2 identifies services by CODE ("MOB") while result set 1 names
//     the very same services by their master name ("Mobility (RAN/Core)") — one
//     page showing both labels for one service reads as two different things,
//     so codes are resolved to names below;
//   • the proc emits one row per CRQ_CAB_SERVICE_TBL row, so a service with six
//     rows arrives six times — those collapse into one line carrying the count;
//   • 'NO SERVICES' arrives through the service-code column, so the "this CRQ
//     has none" answer has to be told apart from the name of a real service;
//   • the nine approver columns are a three-rung ladder, of which exactly one
//     rung is live at a time — so "the approver" is a derived thing, not a
//     column, and getting it wrong names someone who no longer owes anything.
//
// Since the 2026-09-09 re-authoring this set covers DECIDED services as well as
// open ones, while still calling its key column `Pending_Service_Code`. Every
// count below therefore filters on the row's own Status rather than trusting
// the column name — the previous revision's habit of treating one row as one
// piece of open work now silently triples the "awaiting" figure on a CRQ whose
// services are mostly approved.
//
// The whole thing happens on the rows already in hand — no extra round trip,
// and nothing here depends on the ORDER the proc returns rows in, which it does
// not guarantee for this result set.

/**
 * The proc's sentinel values, which arrive in place of a service code.
 * 'NO SERVICES PENDING' is no longer emitted — with decided services now in the
 * set, "all decided" is read off the Status column — but it is still recognised
 * so a database on the older revision keeps reporting the right verdict.
 */
const SENTINEL_NO_SERVICES = "NO SERVICES";
const SENTINEL_NO_PENDING = "NO SERVICES PENDING";

/**
 * CRQ_CAB_SERVICE_MASTER (Service_Code → Service_Name) — the same table result
 * set 1 already reads its labels from, mirrored here because result set 2 emits
 * only the code. Refresh with:
 *   SELECT Service_Code, Service_Name FROM CRQ_CAB_SERVICE_MASTER ORDER BY Sort_Order;
 *
 * Deliberately not the only resolution path: a code an admin adds after this
 * list was written is still resolved from result set 1 below, and an
 * unresolvable code renders as itself rather than as a blank.
 */
const SERVICE_CODE_NAMES: Record<string, string> = {
  // Current seed (2026-08-25). It spells every name identically to its code, so
  // these entries buy no nicer label — they buy the knowledge that the code is a
  // real, current service rather than an unresolved one, which is what tells the
  // roster whether a separate code chip would say anything.
  B2B: "B2B",
  "B2C-HOMES": "B2C-HOMES",
  "B2C-MOBILITY": "B2C-MOBILITY",
  IWAN: "IWAN",
  NA: "NA",
  // Superseded codes. Still worth carrying: CRQ_CAB_SERVICE_TBL rows created
  // before the re-seed keep them, and they still surface in the pending result
  // set even though the journey and SPOC sets — which INNER JOIN the master —
  // drop them entirely.
  RAN: "Radio Access Network",
  TX: "Transmission",
  MOB: "Mobility (RAN/Core)",
  TEL: "Telemedia",
  CORE: "Core Services",
  INFRA: "Infrastructure",
};

export type PendingApprovalsVerdict = "awaiting" | "all_decided" | "no_services" | "unknown";

export interface PendingApprovalsSummary {
  verdict: PendingApprovalsVerdict;
  /**
   * One entry per (service, decision, ladder), de-duplicated and named. Never a
   * sentinel. Includes DECIDED services since the 2026-09-09 proc revision — read
   * each entry's `status`; `pending` below is the pre-filtered open subset.
   */
  services: PendingApprovalView[];
  /** Just the entries still awaiting a decision — what "pending" used to mean for the whole array. */
  pending: PendingApprovalView[];
  /** How many CRQ_CAB_SERVICE_TBL rows are open in total, across those services. */
  totalPending: number;
  /** Pending services with nobody on the live rung — a reportable gap, not a lookup bug. */
  unconfigured: PendingApprovalView[];
  /** Pending services the proc flagged as escalated past L1. */
  escalated: PendingApprovalView[];
}

const clean = (value: string | null | undefined): string => (value ?? "").trim();

/**
 * Resolves each service CODE to its display name.
 *
 * Two independent sources, so neither being incomplete loses the name:
 *   1. SERVICE_CODE_NAMES, mirroring the service master;
 *   2. the service rows of result set 1, which are already labelled with the
 *      master name for exactly the services on this CRQ.
 *
 * Source 2 is matched by content, never by position — the two result sets are
 * built by different queries and only one of them has an ORDER BY, so pairing
 * them by index would mislabel services the moment either query is touched.
 * As a last step, a single leftover code and a single unclaimed name can only
 * be each other, so they are paired; anything more ambiguous stays unresolved
 * and shows the raw code.
 *
 * All service rows are offered, not just the pending ones: result set 2 now
 * carries decided services too, and filtering the name pool to pending rows
 * would leave exactly those codes to fall through to the raw-code fallback.
 */
const resolveServiceNames = (
  codes: string[],
  serviceRows: CrqJourneyStageRow[]
): Map<string, string> => {
  const resolved = new Map<string, string>();

  // Every service name result set 1 reports, de-duplicated.
  const unclaimedNames = new Set(serviceRows.map((r) => clean(r.stage)).filter(Boolean));

  const claim = (name: string) => {
    unclaimedNames.delete(name);
    return name;
  };

  for (const code of codes) {
    const fromMaster = SERVICE_CODE_NAMES[code.toUpperCase()];
    if (fromMaster) {
      // Claim the matching result-set-1 name when it's there, so it can't also
      // be handed to a different, unmapped code further down.
      const corroborated = [...unclaimedNames].find((n) => n.toUpperCase() === fromMaster.toUpperCase());
      resolved.set(code, corroborated ? claim(corroborated) : fromMaster);
      continue;
    }

    // Unmapped code: a master name that spells the code out ("B2B" inside
    // "Enterprise / B2B") is a safe match.
    const byToken = [...unclaimedNames].find((n) => n.toUpperCase().includes(code.toUpperCase()));
    if (byToken) resolved.set(code, claim(byToken));
  }

  const leftover = codes.filter((c) => !resolved.has(c));
  if (leftover.length === 1 && unclaimedNames.size === 1) {
    resolved.set(leftover[0], [...unclaimedNames][0]);
  }

  return resolved;
};

/** The ladder's rungs in escalation order — the order every chain is built in. */
export const APPROVER_LEVELS: ApproverLevelKey[] = ["L1", "L2", "L3"];

const EMPTY_SUMMARY: PendingApprovalsSummary = {
  verdict: "unknown",
  services: [],
  pending: [],
  totalPending: 0,
  unconfigured: [],
  escalated: [],
};

/**
 * One row's three approver columns → the ladder the UI walks.
 *
 * The live rung is the one the proc flagged ESCALATED, and it flags at most one:
 * the flag is derived from CRQ_CAB_SERVICE_TBL.Escalation_Level, a single enum
 * naming where the approval currently sits. No flag means the approval was
 * never escalated, which puts it on L1 by definition — so `current` always
 * lands on exactly one rung and "who owes this decision" is never ambiguous.
 *
 * The flag says WHERE the approval sits, not THAT it has moved, and the two
 * part company on L1. The procedure writes L1_Escalated_Remark = 'ESCALATED'
 * whenever Is_Escalated = 1 AND Escalation_Level = 'L1' — and a row sits in
 * exactly that state the moment escalation TRACKING is switched on, before any
 * escalation has actually happened: CRQ000005097485 carries Is_Escalated = 1,
 * Escalation_Level = 'L1', Escalated_At = NULL on all four of its services.
 * Reading the flag as "has escalated" badges every such service amber and makes
 * the roster's own summary contradict itself — "escalated past the first
 * approver: B2B (now L1)". So `escalated` is derived from the rung the approval
 * LANDED on rather than from the presence of a flag: true only once the live
 * rung is past L1. `currentLevel` still follows the flag, because a flagged L1
 * and an unflagged L1 are the same place to send a reader.
 *
 * All three rungs are emitted however sparsely configured, so the UI can show
 * an unstaffed escalation path as the gap it is rather than as a shorter ladder.
 * A rung is `configured` on a name OR an ID: the escalation table lets either be
 * null independently, and a rung with only one of them still names a person.
 */
const buildApproverChain = (
  row: CrqPendingApproval
): { chain: ApproverLevelView[]; currentLevel: ApproverLevelKey; escalated: boolean } => {
  const raw: Record<ApproverLevelKey, CrqApproverLevel | null> = {
    L1: row.l1 ?? null,
    L2: row.l2 ?? null,
    L3: row.l3 ?? null,
  };

  const flagged = APPROVER_LEVELS.find((level) => raw[level]?.escalated) ?? null;
  const currentLevel = flagged ?? "L1";

  const chain = APPROVER_LEVELS.map<ApproverLevelView>((level) => {
    const source = raw[level];
    const olmId = clean(source?.olmId) || null;
    const name = clean(source?.name) || null;
    return {
      level,
      olmId,
      name,
      escalated: !!source?.escalated,
      current: level === currentLevel,
      configured: !!olmId || !!name,
    };
  });

  return { chain, currentLevel, escalated: currentLevel !== "L1" };
};

/**
 * Raw result set 2 → what the UI renders.
 *
 * `serviceRows` are the service rows of result set 1 (i.e. the grouped flow's
 * `approvals`), used only to put proper names on the codes.
 *
 * Every service the CRQ has comes back in `services`, decided ones included,
 * because the panel lists the whole roster; `pending` and the counts alongside
 * it are the open subset, filtered on each row's own Status rather than on the
 * misleading `Pending_Service_Code` column name.
 */
export const summarizeServiceApprovals = (
  rows: CrqPendingApproval[] | null | undefined,
  serviceRows: CrqJourneyStageRow[] = []
): PendingApprovalsSummary => {
  const all = rows ?? [];

  // An older database, or a backend that only forwarded the journey rows: there
  // is nothing to report and no gap to flag.
  if (!all.length) return EMPTY_SUMMARY;

  const codes = all.map((r) => clean(r.serviceCode).toUpperCase());
  if (codes.includes(SENTINEL_NO_PENDING)) return { ...EMPTY_SUMMARY, verdict: "all_decided" };
  if (codes.includes(SENTINEL_NO_SERVICES)) return { ...EMPTY_SUMMARY, verdict: "no_services" };

  // One line per (service, decision, ladder). Keyed on all three because the
  // approval config is per circle: the same service really can sit on two
  // different ladders, and can be approved on one row while open on another —
  // collapsing on the code alone would hide whichever arrived second.
  const grouped = new Map<string, PendingApprovalView>();

  for (const row of all) {
    const code = clean(row.serviceCode);
    if (!code) continue;

    const status = normalizeApprovalStatus(row.status);
    const { chain, currentLevel, escalated } = buildApproverChain(row);
    const current = chain.find((rung) => rung.current) ?? chain[0];

    const ladder = chain.map((rung) => `${rung.olmId ?? ""}~${rung.name ?? ""}`).join("|");
    const key = `${code.toUpperCase()}|${status}|${currentLevel}|${ladder.toUpperCase()}`;

    const existing = grouped.get(key);
    if (existing) {
      // Only open rows are work; a repeated decided row is just the proc
      // emitting one line per CRQ_CAB_SERVICE_TBL row.
      if (status === "pending") existing.pendingCount += 1;
      continue;
    }

    grouped.set(key, {
      serviceCode: code,
      serviceName: code, // replaced below once every code is known
      nameResolved: false,
      status,
      pendingCount: status === "pending" ? 1 : 0,
      chain,
      currentLevel,
      escalated,
      approverOlmId: current.olmId,
      approverName: current.name,
      configured: current.configured,
    });
  }

  const services = [...grouped.values()];
  const names = resolveServiceNames(
    [...new Set(services.map((s) => s.serviceCode))],
    serviceRows
  );

  for (const service of services) {
    const name = names.get(service.serviceCode);
    if (name) {
      service.serviceName = name;
      service.nameResolved = true;
    }
  }

  // Same order the approvals lane uses, so the panel and the canvas read alike;
  // an unresolved code sorts last rather than interleaving oddly.
  const laneOrder = serviceRows.map((r) => clean(r.stage).toUpperCase());
  const rank = (s: PendingApprovalView) => {
    const i = laneOrder.indexOf(s.serviceName.toUpperCase());
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  services.sort((a, b) => rank(a) - rank(b) || a.serviceName.localeCompare(b.serviceName));

  const pending = services.filter((s) => s.status === "pending");

  return {
    verdict: pending.length ? "awaiting" : services.length ? "all_decided" : "unknown",
    services,
    pending,
    totalPending: pending.reduce((sum, s) => sum + s.pendingCount, 0),
    unconfigured: pending.filter((s) => !s.configured),
    escalated: pending.filter((s) => s.escalated),
  };
};

/**
 * Approver display name, with the OLM ID as the fallback identity: an approver
 * whose config row carries an ID but no name is still a real person to chase,
 * and showing the ID beats showing "—".
 *
 * Reads the CURRENT rung of the ladder, which is what `approverOlmId` /
 * `approverName` now hold — naming L1 on an approval that has escalated past
 * them sends the reader to someone who no longer owes anything.
 */
export const approverLabel = (row: PendingApprovalView): string =>
  row.approverName ?? row.approverOlmId ?? "Not assigned";

/** Two-letter avatar seed — from the name if there is one, else the OLM ID. */
export const approverInitials = (row: PendingApprovalView): string => {
  const source = row.approverName ?? row.approverOlmId ?? "";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/** One rung as a single line, for the ladder tooltip: "L2 · Venkatraman Ezhumalai (A1VE3S1U)". */
export const approverLevelLabel = (rung: ApproverLevelView): string => {
  if (!rung.configured) return `${rung.level} · Not configured`;
  const name = rung.name ?? rung.olmId ?? "";
  const id = rung.name && rung.olmId ? ` (${rung.olmId})` : "";
  return `${rung.level} · ${name}${id}`;
};

/**
 * Lookup from an approvals-lane card in the canvas back to its approver.
 *
 * Keyed on both the resolved name (which is what a lane card holds) and the raw
 * code, upper-cased, so either spelling finds the row.
 *
 * A lane card cannot tell two circles of the same service apart, so one entry
 * has to stand for all of them. An OPEN one wins — the card only shows an
 * approver while it is still pending, and a CRQ carrying the same service both
 * approved and open would otherwise resolve to the decided row and leave the
 * pending card claiming nobody owes it a decision. Between two equally open
 * rows the first wins, which is the approvals-lane order.
 */
export const buildApproverIndex = (
  services: PendingApprovalView[]
): Map<string, PendingApprovalView> => {
  const index = new Map<string, PendingApprovalView>();
  for (const service of services) {
    for (const key of [service.serviceName, service.serviceCode]) {
      const k = key.trim().toUpperCase();
      if (!k) continue;
      const held = index.get(k);
      if (!held || (held.status !== "pending" && service.status === "pending")) {
        index.set(k, service);
      }
    }
  }
  return index;
};

// ─── Service roster: the three service-shaped result sets, merged ────────────
//
// The payload describes the same services three times over and never the same
// way twice:
//   • the journey rows (result set 1) know each service's DECISION but name it
//     by its master display name;
//   • the approval rows (result set 2) know WHO must decide it, on which rung of
//     the escalation ladder, but identify it by raw code;
//   • the SPOC rows (result set 3) know WHO OWNS it — but they too carry only
//     the code, and are INNER JOINed to a master the approval rows are not.
//
// Read separately they answer half a question each; a CAB manager chasing a
// stalled CRQ wants one line per service saying what state it is in, who owes
// the decision, and who to ring. That is what this builds.
//
// Everything is matched by content — code against code, name against name —
// never by index. Only one of the three sets has an ORDER BY, the SPOC set is
// INNER JOINed to a master the others are not, and the procedure has re-ordered
// its result sets twice; pairing them positionally would mislabel services the
// first time any of that shifts again.

export interface ServiceRosterSummary {
  /** One line per service, SPOC-set order first (i.e. the master's Sort_Order). */
  rows: ServiceRosterRow[];
  /** Services still awaiting a decision. */
  pendingServices: number;
  /** Open CRQ_CAB_SERVICE_TBL rows across those services. */
  totalPending: number;
  /** Pending services with nobody on their live escalation rung — a reportable gap. */
  unconfigured: number;
  /** Pending services that have been escalated past L1 — the ones ageing badly. */
  escalated: number;
  /** Services carrying at least one recorded contact; 0 means the SPOC column is dead weight. */
  withSpoc: number;
  /** The CRQ has no CAB service at all (the 'NO SERVICES' sentinel, or nothing in any set). */
  empty: boolean;
  /**
   * Every service is decided — the panel says so rather than showing an empty
   * "who owes a decision" table.
   */
  allDecided: boolean;
  /**
   * The SPOC set contributed nothing: either the backend is talking to a
   * database still running a pre-2026-09-08 procedure, or every service code on
   * this CRQ predates the current master and was dropped by the INNER JOIN.
   * Either way the roster falls back to what the pending set alone can say.
   */
  spocSetMissing: boolean;
}

const EMPTY_ROSTER: ServiceRosterSummary = {
  rows: [],
  pendingServices: 0,
  totalPending: 0,
  unconfigured: 0,
  escalated: 0,
  withSpoc: 0,
  empty: true,
  allDecided: false,
  spocSetMissing: true,
};

/** Distinct (name, contact) pairs, in first-seen order; a row carrying neither is dropped. */
const collectSpocs = (rows: CrqServiceSpoc[]): ServiceSpocContact[] => {
  const seen = new Map<string, ServiceSpocContact>();
  for (const row of rows) {
    const name = clean(row.spocName) || null;
    const contact = clean(row.spocContact) || null;
    if (!name && !contact) continue;
    const key = `${(name ?? "").toUpperCase()}|${contact ?? ""}`;
    if (!seen.has(key)) seen.set(key, { name, contact });
  }
  return [...seen.values()];
};

/**
 * Decision state for one service, read off the journey rows carrying its
 * display name. A service with several CRQ_CAB_SERVICE_TBL rows produces
 * several journey rows, which can disagree — a rejection is the one a reader
 * must not miss, so it wins, then an approval; an unmatched service (its code
 * no longer resolves in the master) stays null rather than being guessed at.
 *
 * Only a fallback now: since 2026-09-09 the approval set carries each service's
 * own Status, which is authoritative and — unlike this one — does not depend on
 * the service surviving the master join or on its display name being matchable.
 * This still covers a service the approval set never mentioned, and a database
 * on the older revision that reports only the pending ones.
 */
const decidedStatus = (
  serviceName: string,
  journeyServiceRows: CrqJourneyStageRow[]
): ApprovalStatus | null => {
  const matches = journeyServiceRows.filter(
    (r) => clean(r.stage).toUpperCase() === serviceName.toUpperCase()
  );
  if (!matches.length) return null;
  const statuses = matches.map((r) => normalizeApprovalStatus(r.status));
  if (statuses.includes("rejected")) return "rejected";
  if (statuses.includes("approved")) return "approved";
  return null;
};

/**
 * Merges the SPOC rows, the summarized service approvals and the journey's
 * service rows into one line per service.
 *
 * `approvals` is the already-summarized output of summarizeServiceApprovals, so
 * the de-duplication, sentinel handling, ladder resolution and code→name
 * resolution it performs are not repeated here.
 */
export const buildServiceRoster = (
  spocRows: CrqServiceSpoc[] | null | undefined,
  approvals: PendingApprovalsSummary,
  journeyServiceRows: CrqJourneyStageRow[] = []
): ServiceRosterSummary => {
  // The sentinel is the procedure saying "no CAB service on this CRQ"; it is a
  // message, not a service, and must never become a roster line.
  const realSpocRows = (spocRows ?? []).filter((r) => {
    const code = clean(r.serviceCode).toUpperCase();
    return code && code !== SENTINEL_NO_SERVICES && code !== SENTINEL_NO_PENDING;
  });
  const spocSetMissing = realSpocRows.length === 0;

  if (spocSetMissing && !approvals.services.length) {
    // Nothing anywhere. Distinguish "the CRQ has no services" and "everything is
    // decided", both of which the approval set states outright, from "we were
    // told nothing at all" — the panel says something different for each.
    return {
      ...EMPTY_ROSTER,
      empty: approvals.verdict === "no_services",
      allDecided: approvals.verdict === "all_decided",
      spocSetMissing,
    };
  }

  // Grouped by code, preserving the SPOC set's order — the procedure sorts it by
  // the master's Sort_Order, which is the order the business reads services in.
  const grouped = new Map<string, CrqServiceSpoc[]>();
  for (const row of realSpocRows) {
    const key = clean(row.serviceCode).toUpperCase();
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  // An open row wins the code when a service holds both — that is the line the
  // panel must show, and the one the counts are about. Otherwise first wins, so
  // the approval set's own (lane) order decides.
  const approvalByCode = new Map<string, PendingApprovalView>();
  for (const service of approvals.services) {
    const code = service.serviceCode.toUpperCase();
    const held = approvalByCode.get(code);
    if (!held || (held.status !== "pending" && service.status === "pending")) {
      approvalByCode.set(code, service);
    }
  }

  // Services the SPOC set never mentioned still belong on the roster: a code
  // dropped from the service master disappears from the journey and SPOC sets
  // but stays in the approval set, and hiding it would hide real open work.
  const codes = [...grouped.keys()];
  for (const code of approvalByCode.keys()) if (!grouped.has(code)) codes.push(code);

  const rows: ServiceRosterRow[] = codes.map((code) => {
    const spocSource = grouped.get(code) ?? [];
    const approver = approvalByCode.get(code) ?? null;

    // The approval summary already resolved this code against both the master
    // map and the journey rows, so prefer its answer over redoing that work.
    const mapped = SERVICE_CODE_NAMES[code];
    const serviceName = approver?.nameResolved ? approver.serviceName : (mapped ?? code);
    const nameResolved = !!approver?.nameResolved || !!mapped;

    return {
      serviceCode: spocSource.length
        ? clean(spocSource[0].serviceCode)
        : (approver?.serviceCode ?? code),
      serviceName,
      nameResolved,
      // The approval row's own Status is authoritative; the journey rows are the
      // fallback for a service that set never listed.
      status: approver ? approver.status : decidedStatus(serviceName, journeyServiceRows),
      pendingCount: approver?.pendingCount ?? 0,
      approver,
      spocs: collectSpocs(spocSource),
      serviceRows: spocSource.length,
      inSpocSet: spocSource.length > 0,
    };
  });

  // Every count is scoped to rows still awaiting a decision: the approval set
  // reports decided services too now, and an approver named on a decided row is
  // a matter of record, not an outstanding gap to chase.
  const openRows = rows.filter((r) => r.status === "pending");

  return {
    rows,
    pendingServices: openRows.length,
    totalPending: rows.reduce((sum, r) => sum + r.pendingCount, 0),
    unconfigured: openRows.filter((r) => r.approver && !r.approver.configured).length,
    escalated: openRows.filter((r) => r.approver?.escalated).length,
    withSpoc: rows.filter((r) => r.spocs.length > 0).length,
    empty: rows.length === 0,
    allDecided: rows.length > 0 && openRows.length === 0,
    spocSetMissing,
  };
};

/**
 * A dialable version of a recorded contact, or null when it holds too few
 * digits to be one. Spoc_Contact is free text on CRQ_CAB_SERVICE_TBL and has
 * held things that are plainly not phone numbers, so the tel: link is offered
 * only when there is actually something to dial.
 */
export const telHref = (contact: string | null): string | null => {
  const trimmed = clean(contact);
  const digits = trimmed.replace(/[^0-9+]/g, "");
  return digits.replace(/[^0-9]/g, "").length >= 6 ? `tel:${digits}` : null;
};

// ─── get_crq_details stage codes → friendly labels (Feature 2) ──────────────
const STAGE_CODE_LABELS: Record<string, string> = {
  VALIDATE: "Validate",
  IMPACT_ANALYSIS: "Impact Analysis",
  MOP_CREATION: "MOP Creation",
  MOP_VALIDATION: "MOP Validation",
  SCHEDULING_APPROVAL: "Scheduling Approval",
  EXECUTION: "Execution",
  CLOSURE: "Closure",
};

export const formatStageCode = (code: string): string =>
  STAGE_CODE_LABELS[code.trim().toUpperCase()] ?? formatStatusLabel(code);
