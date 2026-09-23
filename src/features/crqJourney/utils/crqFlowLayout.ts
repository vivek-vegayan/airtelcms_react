import type { CrqJourneyFlow, CrqJourneyStageRow } from "../types/crqJourney.types";
import { normalizeApprovalStatus, normalizeStepStatus } from "./crqJourney.utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Flow-canvas geometry
//
//  The diagram is drawn once in a fixed coordinate space — cards and SVG
//  connectors share it, so they can never drift apart — and the view scales
//  that whole space to fit its container.
//
//  Only three things vary per CRQ, and all three are inputs here: how many
//  service approvals came back, whether the (legacy) assignment row is present,
//  and how many cards the scheduling column has. Everything else is derived, so
//  a 7-approval CRQ grows the canvas downward instead of overlapping the MOP row.
// ─────────────────────────────────────────────────────────────────────────────

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const cx = (r: Rect) => r.x + r.w / 2;
export const cy = (r: Rect) => r.y + r.h / 2;

const CANVAS_W = 1120;
/**
 * Y the section headers hang from — every titled region starts here. Just clears
 * the header block itself (label ~17px + 6px gap + 22px icon chip).
 */
const TOP = 48;

// ── Intake / parallel activities (left) ──────────────────────────────────────
// Tall enough for a three-line title ("Plan & Inventory Validation") plus the
// status badge, without leaving the single-line cards looking hollow.
const STAGE_W = 150;
const STAGE_H = 86;
const LEFT_X = 32;
const LEFT_GAP_X = 20;
const LEFT_ROW_GAP = 30;

// ── Approvals lane ───────────────────────────────────────────────────────────
const APPR_X = 380;
const APPR_W = 332;
const APPR_PAD_X = 16;
const APPR_PAD_TOP = 16;
const APPR_PAD_BOTTOM = 12;
const APPR_MIN_H = 128;
// Exactly what ApprovalCard's content stacks up to: 16 padding + 28 icon +
// 6 + name + 4 + status + 6 + 20 badge. The card clips its overflow, so this
// must never drop below what's inside it.
const APPR_CARD_H = 110;
const APPR_GAP = 10;
// 66 is what lets four approvals sit on one row (the reference layout) at ~67px
// each — wide enough for the shortened service names (Mobility / B2B / NOC
// Head) that formatApprovalName produces. Only a fifth approval wraps.
const APPR_CARD_MIN_W = 66;
const APPR_CARD_MAX_W = 100;
const APPR_INNER_W = APPR_W - APPR_PAD_X * 2;

/** Vertical spine carrying Impact Analysis' output down to the MOP row. */
const SPINE_X = 366;
/** Where the approvals track and the MOP track merge before Scheduling. */
const TRUNK_X = 726;

// ── Scheduling column ────────────────────────────────────────────────────────
const SCHED_X = 744;
const SCHED_W = 156;
const SCHED_H = 58;
const SCHED_GAP = 16;

// ── Execution ────────────────────────────────────────────────────────────────
const EXEC_X = 928;
const EXEC_W = 176;
const EXEC_H = 182;

// ── MOP row ──────────────────────────────────────────────────────────────────
const MOP_X = 380;
const MOP_W = 150;
const MOP_H = 86;
const MOP_V_X = 566;
const MOP_V_W = 154;
const MOP_V_H = 98;
const MOP_CLEARANCE = 32;

export interface SectionHeaderBox {
  x: number;
  w: number;
}

export interface FlowLayoutInput {
  approvalCount: number;
  hasAssignment: boolean;
  /** Cards actually present in the scheduling column: Scheduling, CAB, Conflict Check. */
  schedulingCount: number;
}

export interface FlowLayout {
  width: number;
  height: number;

  assignment: Rect | null;
  validate: Rect;
  impact: Rect;

  approvalsBox: Rect;
  approvalsContent: Rect;
  approvalCardW: number;
  approvalCardH: number;

  mopCreate: Rect;
  mopValidate: Rect;

  /** Positions for the scheduling column, in order — index 0 is the topmost card. */
  schedulingSlots: Rect[];
  execution: Rect;

  spineX: number;
  trunkX: number;
  /** Centre line of the first scheduling card — where the merge trunk arrives. */
  schedEntryY: number;

  headers: {
    parallel: SectionHeaderBox;
    approvals: SectionHeaderBox;
    scheduling: SectionHeaderBox;
  };
}

export const buildFlowLayout = ({
  approvalCount,
  hasAssignment,
  schedulingCount,
}: FlowLayoutInput): FlowLayout => {
  const n = Math.max(0, approvalCount);

  // ── Approvals lane sizing ──
  const perRow =
    n === 0 ? 0 : Math.min(n, Math.max(1, Math.floor((APPR_INNER_W + APPR_GAP) / (APPR_CARD_MIN_W + APPR_GAP))));
  const rows = n === 0 ? 1 : Math.ceil(n / perRow);
  const cardW =
    n === 0 ? 0 : Math.min(APPR_CARD_MAX_W, Math.floor((APPR_INNER_W - (perRow - 1) * APPR_GAP) / perRow));
  const apprH = Math.max(
    APPR_MIN_H,
    APPR_PAD_TOP + rows * APPR_CARD_H + (rows - 1) * APPR_GAP + APPR_PAD_BOTTOM
  );

  const approvalsBox: Rect = { x: APPR_X, y: TOP, w: APPR_W, h: apprH };
  const approvalsContent: Rect = {
    x: APPR_X + APPR_PAD_X,
    y: TOP + APPR_PAD_TOP,
    w: APPR_INNER_W,
    h: apprH - APPR_PAD_TOP - APPR_PAD_BOTTOM,
  };

  // ── Left block: optional assignment row above the parallel pair ──
  const parallelY = TOP + (hasAssignment ? STAGE_H + LEFT_ROW_GAP : 0);
  const assignment: Rect | null = hasAssignment
    ? { x: LEFT_X, y: TOP, w: STAGE_W, h: STAGE_H }
    : null;
  const validate: Rect = { x: LEFT_X, y: parallelY, w: STAGE_W, h: STAGE_H };
  const impact: Rect = { x: LEFT_X + STAGE_W + LEFT_GAP_X, y: parallelY, w: STAGE_W, h: STAGE_H };

  // ── Scheduling column ──
  const schedCount = Math.max(0, schedulingCount);
  const schedulingSlots: Rect[] = Array.from({ length: schedCount }, (_, i) => ({
    x: SCHED_X,
    y: TOP + i * (SCHED_H + SCHED_GAP),
    w: SCHED_W,
    h: SCHED_H,
  }));
  const schedColH = schedCount === 0 ? 0 : schedCount * SCHED_H + (schedCount - 1) * SCHED_GAP;
  const schedEntryY = TOP + SCHED_H / 2;

  // Execution has no section header of its own, so it centres on the scheduling column.
  const execCenterY = TOP + Math.max(schedColH, EXEC_H) / 2;
  const execution: Rect = { x: EXEC_X, y: Math.round(execCenterY - EXEC_H / 2), w: EXEC_W, h: EXEC_H };

  // ── MOP row sits below whatever hangs lowest IN ITS OWN COLUMNS ──
  // It spans x 380→720, entirely to the left of the scheduling column (744+) and
  // execution box (928+), so it only has to clear the left block and the
  // approvals lane. Clearing the taller right-hand columns too — as it used to —
  // bought nothing but empty canvas and pushed the diagram below the fold.
  const mopY =
    Math.max(validate.y + validate.h, approvalsBox.y + approvalsBox.h) + MOP_CLEARANCE;

  const mopCreate: Rect = { x: MOP_X, y: mopY, w: MOP_W, h: MOP_H };
  // Taller (it's usually the running stage) but centred on the same line, so the
  // connector between the two MOP cards stays straight.
  const mopValidate: Rect = {
    x: MOP_V_X,
    y: mopY + (MOP_H - MOP_V_H) / 2,
    w: MOP_V_W,
    h: MOP_V_H,
  };

  // The MOP row is no longer guaranteed to be the lowest thing on the canvas,
  // so the height is the deepest of the three columns rather than just its own.
  const contentBottom = Math.max(
    mopValidate.y + mopValidate.h,
    TOP + schedColH,
    execution.y + execution.h
  );

  return {
    width: CANVAS_W,
    height: Math.round(contentBottom + 16),

    assignment,
    validate,
    impact,

    approvalsBox,
    approvalsContent,
    approvalCardW: cardW,
    approvalCardH: APPR_CARD_H,

    mopCreate,
    mopValidate,

    schedulingSlots,
    execution,

    spineX: SPINE_X,
    trunkX: TRUNK_X,
    schedEntryY,

    headers: {
      parallel: { x: 16, w: impact.x + impact.w - 16 },
      approvals: { x: APPR_X, w: APPR_W },
      scheduling: { x: SCHED_X - 22, w: 200 },
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Connector states
//
//  A connector is coloured by the stage that FEEDS it, so the diagram reads as
//  "work has flowed this far": solid green behind the front line, animated
//  blue/orange at it, faint grey ahead of it, red where it stopped.
// ─────────────────────────────────────────────────────────────────────────────

export type EdgeState = "done" | "active" | "waiting" | "blocked" | "idle";

export interface FlowEdge {
  id: string;
  d: string;
  state: EdgeState;
  arrow?: boolean;
  /** Junction dot drawn where two tracks merge. */
  dot?: { x: number; y: number };
}

const edgeStateOf = (row: CrqJourneyStageRow | null): EdgeState => {
  if (!row) return "idle";
  switch (normalizeStepStatus(row.status)) {
    case "completed":
      return "done";
    case "in_progress":
      return "active";
    case "pending":
      return "waiting";
    case "cancelled":
      return "blocked";
    default:
      return "idle";
  }
};

/** All linked CAB services must clear before the approvals track is "done". */
export const approvalsEdgeState = (rows: CrqJourneyStageRow[]): EdgeState => {
  if (rows.length === 0) return "idle";
  const states = rows.map((r) => normalizeApprovalStatus(r.status));
  if (states.some((s) => s === "rejected")) return "blocked";
  if (states.every((s) => s === "approved")) return "done";
  return "waiting";
};

/** CONFLICT CHECK speaks YES/NO, not the stage vocabulary — YES means a clash was found. */
export const conflictEdgeState = (row: CrqJourneyStageRow | null): EdgeState => {
  if (!row) return "idle";
  const v = row.status.trim().toUpperCase();
  if (v === "YES") return "blocked";
  if (v === "NO") return "done";
  return edgeStateOf(row);
};

const mergeEdgeState = (a: EdgeState, b: EdgeState): EdgeState => {
  if (a === "blocked" || b === "blocked") return "blocked";
  if (a === "done" && b === "done") return "done";
  if (a === "active" || b === "active") return "active";
  if (a === "idle" && b === "idle") return "idle";
  return "waiting";
};

/**
 * Builds every connector path. Callers filter by id for the stages the proc
 * didn't return, so a connector never points at an empty slot.
 */
export const buildFlowEdges = (flow: CrqJourneyFlow, L: FlowLayout): FlowEdge[] => {
  const vCy = cy(L.validate);
  const iCy = cy(L.impact);
  const apprCy = cy(L.approvalsBox);
  const mopCy = cy(L.mopCreate);

  const impactState = edgeStateOf(flow.impactAnalysis);
  const apprState = approvalsEdgeState(flow.approvals);
  const mopValState = edgeStateOf(flow.mopValidate);

  const edges: FlowEdge[] = [];

  if (L.assignment) {
    const aCy = cy(L.assignment);
    edges.push(
      { id: "entry", d: `M14,${aCy} H${L.assignment.x}`, state: "done", arrow: true, dot: { x: 14, y: aCy } },
      {
        id: "assignment-validate",
        d: `M${cx(L.assignment)},${L.assignment.y + L.assignment.h} V${L.validate.y}`,
        state: edgeStateOf(flow.assignment),
        arrow: true,
      }
    );
  } else {
    edges.push({
      id: "entry",
      d: `M14,${vCy} H${L.validate.x}`,
      state: "done",
      arrow: true,
      dot: { x: 14, y: vCy },
    });
  }

  edges.push(
    {
      id: "validate-impact",
      d: `M${L.validate.x + L.validate.w},${vCy} H${L.impact.x}`,
      state: edgeStateOf(flow.validate),
      arrow: true,
    },
    {
      id: "impact-approvals",
      d: `M${L.impact.x + L.impact.w},${iCy} H${L.spineX} V${apprCy} H${L.approvalsBox.x}`,
      state: impactState,
      arrow: true,
    },
    {
      id: "impact-mop",
      d: `M${L.spineX},${iCy} V${mopCy} H${L.mopCreate.x}`,
      state: impactState,
      arrow: true,
    },
    {
      id: "mop-create-validate",
      d: `M${L.mopCreate.x + L.mopCreate.w},${mopCy} H${L.mopValidate.x}`,
      state: edgeStateOf(flow.mopCreate),
      arrow: true,
    },
    {
      id: "approvals-trunk",
      d: `M${L.approvalsBox.x + L.approvalsBox.w},${apprCy} H${L.trunkX}`,
      state: apprState,
      dot: { x: L.trunkX, y: apprCy },
    },
    {
      id: "mop-validate-trunk",
      d: `M${L.mopValidate.x + L.mopValidate.w},${mopCy} H${L.trunkX}`,
      state: mopValState,
      dot: { x: L.trunkX, y: mopCy },
    }
  );

  const firstSlot = L.schedulingSlots[0];
  if (firstSlot) {
    edges.push({
      id: "trunk-scheduling",
      d: `M${L.trunkX},${mopCy} V${L.schedEntryY} H${firstSlot.x}`,
      state: mergeEdgeState(apprState, mopValState),
      arrow: true,
    });
  }

  // The scheduling column's connectors are driven by the SCHEDULING stage
  // alone, not by the card immediately above each link.
  //
  // CAB and CONFLICT CHECK are informational flags, not sequential gates: CAB
  // is NO whenever the CRQ was never put in a session, which is normal and
  // blocks nothing, and CONFLICT CHECK is NO whenever no clash was recorded —
  // including on a CRQ that hasn't got there yet. Colouring links from those
  // rows made the arrow into Execution turn green while Scheduling was still
  // in progress, i.e. claimed work had reached a stage it hadn't.
  const schedState = edgeStateOf(flow.scheduling);

  for (let i = 0; i < L.schedulingSlots.length - 1; i += 1) {
    const from = L.schedulingSlots[i];
    const to = L.schedulingSlots[i + 1];
    edges.push({
      id: `sched-link-${i}`,
      d: `M${cx(from)},${from.y + from.h} V${to.y}`,
      state: schedState,
      arrow: true,
    });
  }

  // Last scheduling card hands off to Execution once Scheduling is approved —
  // unless the conflict check actually found a clash, which does block it.
  const lastSlot = L.schedulingSlots[L.schedulingSlots.length - 1];
  if (lastSlot) {
    const conflictState = conflictEdgeState(flow.conflictCheck);
    edges.push({
      id: "scheduling-execution",
      d: `M${lastSlot.x + lastSlot.w},${cy(lastSlot)} H${lastSlot.x + lastSlot.w + 14} V${cy(
        L.execution
      )} H${L.execution.x}`,
      state: conflictState === "blocked" ? "blocked" : schedState,
      arrow: true,
    });
  }

  return edges;
};
