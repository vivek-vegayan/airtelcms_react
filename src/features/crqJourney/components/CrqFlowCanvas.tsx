import React, { useId, useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import type { CrqJourneyFlow, PendingApprovalView, StepStatus } from "../types/crqJourney.types";
import {
  formatStageName,
  formatStatusLabel,
  normalizeStepStatus,
  getStepStatusConfig,
  getFlowHues,
} from "../utils/crqJourney.utils";
import {
  buildFlowEdges,
  buildFlowLayout,
  type EdgeState,
  type FlowEdge,
  type FlowLayout,
  type Rect,
} from "../utils/crqFlowLayout";
import { useAutoFitScale } from "../hooks/useAutoFitScale";
import { StageCard } from "./StageCard";
import { ApprovalCard } from "./ApprovalCard";
import { RowCard } from "./RowCard";
import { ExecutionListCard } from "./ExecutionListCard";
import { CrqFlowStacked } from "./CrqFlowStacked";
import { buildSchedulingChain } from "./schedulingChain";

interface CrqFlowCanvasProps {
  flow: CrqJourneyFlow;
  showLegend: boolean;
  onToggleLegend?: () => void;
  /**
   * Service name / code → the approver who owes a decision on it (result set 2
   * of sp_get_crq_journey_page). An approvals-lane card is ~90px wide, so the
   * approver can only live in the card's tooltip; the full picture is the
   * ServiceRosterPanel below this canvas.
   */
  approverIndex?: Map<string, PendingApprovalView>;
  /**
   * Extra vertical space to leave free below the canvas, in CSS px — for
   * whatever the page stacks underneath it (the pending-approvals panel).
   *
   * The canvas fits itself into the viewport height left below its own top
   * edge, so without this it sizes as if it owned everything down to the fold
   * and pushes the next block off-screen.
   *
   * Must be derived from state, never measured from the DOM. A measured height
   * closes a loop at the window widths where the page sits right on the
   * overflow boundary: bigger canvas → scrollbar → narrower page → the block
   * below reflows taller → bigger reserve → smaller canvas → scrollbar goes →
   * repeat. See serviceRosterReserve for the state-derived version.
   */
  bottomReserve?: number;
}

// ─── Connector styling per edge state ────────────────────────────────────────
const EDGE_STYLE: Record<
  EdgeState,
  { hue: "green" | "blue" | "orange" | "red" | "grey"; dash?: string; animate?: boolean; pulse?: boolean }
> = {
  done:    { hue: "green" },
  active:  { hue: "blue",   dash: "6 5", animate: true, pulse: true },
  waiting: { hue: "orange", dash: "6 5", animate: true },
  blocked: { hue: "red",    dash: "5 4", animate: true },
  idle:    { hue: "grey",   dash: "2 6" },
};

const EDGE_STATES: EdgeState[] = ["done", "active", "waiting", "blocked", "idle"];

// ─── SVG connector layer ─────────────────────────────────────────────────────
const FlowConnectors: React.FC<{ layout: FlowLayout; edges: FlowEdge[] }> = ({ layout, edges }) => {
  const theme = useTheme();
  const hues = getFlowHues(theme.palette.mode === "dark");
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }}
      aria-hidden
    >
      <defs>
        {EDGE_STATES.map((state) => (
          <marker
            key={state}
            id={`${uid}-arrow-${state}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6.5,3 L0,6 Z" fill={hues[EDGE_STYLE[state].hue]} />
          </marker>
        ))}
        <filter id={`${uid}-glow`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`@keyframes crqDashFlow { to { stroke-dashoffset: -22; } }`}</style>
      </defs>

      {edges.map((edge) => {
        const style = EDGE_STYLE[edge.state];
        const color = hues[style.hue];
        return (
          <g key={edge.id}>
            <path
              d={edge.d}
              fill="none"
              stroke={color}
              strokeWidth={edge.state === "idle" ? 1.5 : 1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={style.dash}
              markerEnd={edge.arrow ? `url(#${uid}-arrow-${edge.state})` : undefined}
              style={style.animate ? { animation: "crqDashFlow 1.2s linear infinite" } : undefined}
            />
            {edge.dot && <circle cx={edge.dot.x} cy={edge.dot.y} r={3.4} fill={color} />}
            {/* travelling packet — only along the edge leaving the stage that's actually running */}
            {style.pulse && (
              <g filter={`url(#${uid}-glow)`}>
                <circle r="3.1" fill={color}>
                  <animateMotion dur="2.4s" repeatCount="indefinite" calcMode="linear" path={edge.d} />
                </circle>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Section header (label + icon chip, centred over its region) ─────────────
const SectionHeader: React.FC<{
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  count?: number;
  box: { x: number; w: number };
}> = ({ label, color, bgColor, icon: Icon, count, box }) => (
  <Box sx={{ position: "absolute", top: 0, left: box.x, width: box.w, textAlign: "center", zIndex: 1 }}>
    <Typography
      component="div"
      sx={{
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "0.8px",
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
      }}
    >
      {label}
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            minWidth: 17,
            height: 16,
            px: "4px",
            borderRadius: "8px",
            background: bgColor,
            color,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {count}
        </Box>
      )}
    </Typography>
    <Box
      sx={{
        mt: "6px",
        mx: "auto",
        width: 22,
        height: 22,
        borderRadius: "7px",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
      }}
    >
      <Icon sx={{ fontSize: 12 }} />
    </Box>
  </Box>
);

const positioned = (r: Rect) => ({ position: "absolute" as const, left: r.x, top: r.y });

const BASE_LEGEND: StepStatus[] = ["completed", "in_progress", "pending", "not_started"];

// ─────────────────────────────────────────────────────────────────────────────
//  Static styling for the scaled canvas layer.
//
//  Both of these are module-level on purpose. The fit scale changes as the
//  window does, and anything scale-dependent left in `sx` makes Emotion
//  serialise a brand-new class — and re-inject these keyframes under the same
//  name — on every single tick, which restarts the fade-in: the diagram reads
//  as flashing rather than resizing. The varying part (transform, box size) is
//  passed through `style` instead, where it's a plain inline mutation.
// ─────────────────────────────────────────────────────────────────────────────
const flowFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const CANVAS_LAYER_SX = {
  position: "absolute",
  top: 0,
  left: 0,
  transformOrigin: "top left",
  animation: `${flowFadeIn} 0.35s ease-out`,
} as const;

const CANVAS_FRAME_SX = { position: "relative", mx: "auto" } as const;

export const CrqFlowCanvas: React.FC<CrqFlowCanvasProps> = ({
  flow,
  showLegend,
  onToggleLegend,
  approverIndex,
  bottomReserve = 0,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  // noSsr: without it the first paint always answers "false" and renders the
  // desktop canvas, which then swaps to the stacked list a frame later on a
  // phone — a visible flash of the wrong layout on every mount.
  const isCompactViewport = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  const {
    assignment,
    approvals,
    validate,
    impactAnalysis,
    mopCreate,
    mopValidate,
    implementation,
    closure,
  } = flow;

  const hasApprovals = approvals.length > 0;
  const hasExecution = Boolean(implementation || closure);

  // Scheduling column: Scheduling → CAB → Conflict Check, skipping any the proc
  // didn't return. CAB and Conflict Check answer YES/NO rather than speaking the
  // stage vocabulary, so each carries its own label + tone.
  const schedulingChain = useMemo(() => buildSchedulingChain(flow, isDark), [flow, isDark]);

  const layout = useMemo(
    () =>
      buildFlowLayout({
        approvalCount: approvals.length,
        hasAssignment: !!assignment,
        schedulingCount: schedulingChain.length,
      }),
    [approvals.length, assignment, schedulingChain.length]
  );

  // A connector is only drawn when both stages it links came back from the proc
  // — a line pointing at an empty slot reads as a broken diagram.
  const edges = useMemo(() => {
    const present: Record<string, boolean> = {
      entry: !!(assignment ?? validate),
      "assignment-validate": !!assignment && !!validate,
      "validate-impact": !!validate && !!impactAnalysis,
      "impact-approvals": !!impactAnalysis,
      "impact-mop": !!impactAnalysis && !!mopCreate,
      "mop-create-validate": !!mopCreate && !!mopValidate,
      "approvals-trunk": hasApprovals,
      "mop-validate-trunk": !!mopValidate,
      "trunk-scheduling": schedulingChain.length > 0 && (!!mopValidate || hasApprovals),
      "scheduling-execution": schedulingChain.length > 0 && hasExecution,
    };
    return buildFlowEdges(flow, layout).filter((e) => present[e.id] ?? e.id.startsWith("sched-link-"));
  }, [flow, layout, schedulingChain, assignment, validate, impactAnalysis, mopCreate, mopValidate, hasApprovals, hasExecution]);

  // baseHeight makes the fit two-dimensional: the diagram shrinks to whatever
  // viewport height is left under the selector + info strip, so it reads in one
  // view rather than trailing off below the fold.
  const { ref: fitRef, scale, isFloored } = useAutoFitScale(layout.width, {
    baseHeight: layout.height,
    // Everything the shell draws under the measured node — card padding +
    // border (~11px), the page column's bottom padding (8px), plus real
    // clearance. Fitting flush to the viewport instead makes the page overflow
    // by a hair, which flips the app scrollbar on and off. Anything the page
    // stacks below the canvas is added on top of that.
    bottomGutter: 44 + bottomReserve,
  });

  const stepCfg = getStepStatusConfig(isDark);

  const implStatus = implementation ? normalizeStepStatus(implementation.status) : "not_started";
  const closureStatus = closure ? normalizeStepStatus(closure.status) : "not_started";

  // Only surface "Cancelled" in the legend when the CRQ actually is.
  const legendKeys = useMemo(() => {
    const all = [
      assignment, validate, impactAnalysis, mopCreate, mopValidate,
      ...schedulingChain.map((s) => s.row), implementation, closure,
    ];
    const anyCancelled = all.some((r) => r && normalizeStepStatus(r.status) === "cancelled");
    return anyCancelled ? [...BASE_LEGEND, "cancelled" as StepStatus] : BASE_LEGEND;
  }, [assignment, validate, impactAnalysis, mopCreate, mopValidate, schedulingChain, implementation, closure]);

  // Section-header hues (green / purple / orange) — same tone formula as the shared status config.
  const sectionTone = (base: string, darkText: string, lightText: string) => ({
    color: isDark ? darkText : lightText,
    bgColor: alpha(base, isDark ? 0.18 : 0.09),
  });
  const parallelTone = sectionTone("#16A34A", "#5DCAA5", "#15803D");
  const approvalsTone = sectionTone("#7C3AED", "#C4A6F5", "#6D28D9");
  const schedulingTone = sectionTone("#ED8B00", "#FAC775", "#C2410C");

  const header = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
      <Typography sx={{ fontSize: { xs: 13.5, sm: 14.5 }, fontWeight: 600, color: "text.primary" }}>
        CRQ Process Flow
      </Typography>

      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: { xs: 1, lg: 2 }, flexWrap: "wrap" }}>
        {showLegend &&
          legendKeys.map((key) => (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{ width: 8, height: 8, borderRadius: "50%", background: stepCfg[key].color, flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", whiteSpace: "nowrap" }}>
                {stepCfg[key].label}
              </Typography>
            </Box>
          ))}

        {onToggleLegend && (
          <Tooltip title={showLegend ? "Hide legend" : "Show legend"} arrow>
            <IconButton size="small" onClick={onToggleLegend} sx={{ color: "text.secondary", p: "3px" }}>
              {showLegend ? (
                <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} />
              ) : (
                <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  const shell = (children: React.ReactNode) => (
    <Box
      sx={{
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "14px",
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(16,40,70,0.05)",
        p: { xs: "8px 12px 10px", md: "8px 14px 10px" },
      }}
    >
      {header}
      {children}
    </Box>
  );

  // ── Narrow viewports get a stacked lane list instead of a shrunken diagram ──
  if (isCompactViewport) {
    return shell(
      <CrqFlowStacked flow={flow} schedulingChain={schedulingChain} approverIndex={approverIndex} />
    );
  }

  return shell(
    <Box
      ref={fitRef}
      sx={{
        width: "100%",
        pt: 0.25,
        overflowX: isFloored ? "auto" : "hidden",
        overflowY: "hidden",
        // The horizontal scrollbar takes its height out of this box, and
        // overflowY is hidden — without the reserve it eats the bottom edge of
        // the diagram at the sizes where scrolling kicks in.
        pb: isFloored ? "10px" : 0,
      }}
    >
      <Box
        sx={CANVAS_FRAME_SX}
        style={{
          width: Math.round(layout.width * scale),
          height: Math.round(layout.height * scale),
        }}
      >
        <Box
          sx={CANVAS_LAYER_SX}
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${scale})`,
          }}
        >
          <FlowConnectors layout={layout} edges={edges} />

          <SectionHeader
            label="PARALLEL ACTIVITIES"
            color={parallelTone.color}
            bgColor={parallelTone.bgColor}
            icon={LinkRoundedIcon}
            box={layout.headers.parallel}
          />
          <SectionHeader
            label="APPROVALS TRIGGERED"
            color={approvalsTone.color}
            bgColor={approvalsTone.bgColor}
            icon={CheckCircleRoundedIcon}
            count={approvals.length}
            box={layout.headers.approvals}
          />
          {schedulingChain.length > 0 && (
            <SectionHeader
              label="SCHEDULING & APPROVALS"
              color={schedulingTone.color}
              bgColor={schedulingTone.bgColor}
              icon={CalendarMonthRoundedIcon}
              box={layout.headers.scheduling}
            />
          )}

          {/* ── Intake (legacy) + parallel activities ── */}
          {assignment && layout.assignment && (
            <Box sx={positioned(layout.assignment)}>
              <StageCard stage={assignment} width={layout.assignment.w} height={layout.assignment.h} />
            </Box>
          )}
          {validate && (
            <Box sx={positioned(layout.validate)}>
              <StageCard stage={validate} width={layout.validate.w} height={layout.validate.h} />
            </Box>
          )}
          {impactAnalysis && (
            <Box sx={positioned(layout.impact)}>
              <StageCard stage={impactAnalysis} width={layout.impact.w} height={layout.impact.h} />
            </Box>
          )}

          {/* ── Approvals lane (0..N linked CAB services) ── */}
          <Box
            sx={{
              ...positioned(layout.approvalsBox),
              width: layout.approvalsBox.w,
              height: layout.approvalsBox.h,
              border: `1.6px dashed ${isDark ? "rgba(196,166,245,0.45)" : "#B9A6F0"}`,
              borderRadius: "14px",
              background: isDark ? "rgba(124,58,237,0.06)" : "rgba(124,58,237,0.022)",
            }}
          />
          <Box
            sx={{
              ...positioned(layout.approvalsContent),
              width: layout.approvalsContent.w,
              height: layout.approvalsContent.h,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignContent: hasApprovals ? "flex-start" : "center",
              alignItems: hasApprovals ? "stretch" : "center",
              gap: "10px",
              zIndex: 1,
            }}
          >
            {hasApprovals ? (
              approvals.map((a, idx) => (
                <ApprovalCard
                  key={`${a.stage}-${idx}`}
                  approval={a}
                  approver={approverIndex?.get(a.stage.trim().toUpperCase()) ?? null}
                  width={layout.approvalCardW}
                  height={layout.approvalCardH}
                />
              ))
            ) : (
              <Box sx={{ textAlign: "center", px: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "10px",
                    background: approvalsTone.bgColor,
                    color: approvalsTone.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: approvalsTone.color, lineHeight: 1.35 }}>
                  No service approvals triggered
                </Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.35 }}>
                  Impact Analysis linked no CAB services to this CRQ.
                </Typography>
              </Box>
            )}
          </Box>

          {/* ── MOP track ── */}
          {mopCreate && (
            <Box sx={positioned(layout.mopCreate)}>
              <StageCard stage={mopCreate} width={layout.mopCreate.w} height={layout.mopCreate.h} />
            </Box>
          )}
          {mopValidate && (
            <Box sx={positioned(layout.mopValidate)}>
              <StageCard stage={mopValidate} width={layout.mopValidate.w} height={layout.mopValidate.h} />
            </Box>
          )}

          {/* ── Scheduling column ── */}
          {schedulingChain.map((item, idx) => {
            const slot = layout.schedulingSlots[idx];
            if (!slot) return null;
            return (
              <Box key={item.key} sx={positioned(slot)}>
                <RowCard
                  icon={item.icon}
                  label={item.label}
                  statusLabel={item.statusLabel}
                  color={item.tone.color}
                  bgColor={item.tone.bgColor}
                  borderColor={item.tone.borderColor}
                  pulse={item.pulse}
                  width={slot.w}
                  height={slot.h}
                  tooltip={`${item.label} — ${formatStatusLabel(item.row?.status)}`}
                />
              </Box>
            );
          })}

          {/* ── Execution ── */}
          {hasExecution && (
            <Box
              sx={{
                ...positioned(layout.execution),
                width: layout.execution.w,
                height: layout.execution.h,
                border: `1.6px dashed ${isDark ? "rgba(127,180,238,0.45)" : "#9EC2EF"}`,
                borderRadius: "14px",
                background: isDark ? "rgba(25,118,210,0.08)" : "rgba(25,118,210,0.03)",
                p: "10px 12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, justifyContent: "center", mb: 1 }}>
                <Typography
                  sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: theme.palette.primary.main }}
                >
                  EXECUTION
                </Typography>
                <PlayArrowRoundedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
                {implementation && (
                  <ExecutionListCard
                    icon={BuildRoundedIcon}
                    label={formatStageName(implementation.stage)}
                    statusLabel={formatStatusLabel(implementation.status)}
                    color={stepCfg[implStatus].color}
                    muted={implStatus === "not_started"}
                  />
                )}
                {implementation && closure && (
                  <Box
                    sx={{
                      width: 0,
                      height: 10,
                      mx: "auto",
                      borderLeft: `1.6px solid ${
                        implStatus === "completed" ? stepCfg[implStatus].color : theme.palette.divider
                      }`,
                    }}
                  />
                )}
                {closure && (
                  <ExecutionListCard
                    icon={CheckCircleOutlineRoundedIcon}
                    label={formatStageName(closure.stage)}
                    statusLabel={formatStatusLabel(closure.status)}
                    color={stepCfg[closureStatus].color}
                    muted={closureStatus === "not_started"}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {isFloored && (
        <Chip
          size="small"
          label="Scroll horizontally to see the full flow"
          sx={{
            mt: 1,
            fontSize: 10.5,
            color: "text.secondary",
            background: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.04),
          }}
        />
      )}
    </Box>
  );
};
