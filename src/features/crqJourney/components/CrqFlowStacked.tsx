import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { CrqJourneyFlow, CrqJourneyStageRow, PendingApprovalView, StepStatus } from "../types/crqJourney.types";
import { formatStageName, formatStatusLabel, getStepStatusConfig, normalizeStepStatus } from "../utils/crqJourney.utils";
import { StatusIcon } from "./StepStatusBadge";
import { ApprovalCard } from "./ApprovalCard";
import { stageIconFor } from "./StageCard";
import type { SchedulingChainItem } from "./schedulingChain";

// ─────────────────────────────────────────────────────────────────────────────
//  Small-viewport rendering of the same journey.
//
//  Below `md` the fixed-coordinate canvas would have to shrink past the point
//  where its labels are readable, so the same lanes are re-laid out vertically:
//  identical data, identical status vocabulary and colors, no diagram.
// ─────────────────────────────────────────────────────────────────────────────

interface StageRowProps {
  stage: CrqJourneyStageRow;
  label?: string;
  statusLabel?: string;
  /** Overrides the status-derived color (CAB / Conflict Check speak YES/NO, not the stage vocabulary). */
  tone?: { color: string; bgColor: string; borderColor: string };
  /** Overrides the status-derived badge, for those same YES/NO rows. */
  status?: StepStatus;
  icon?: React.ElementType;
}

const StageRow: React.FC<StageRowProps> = ({ stage, label, statusLabel, tone, status: statusOverride, icon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const status = statusOverride ?? normalizeStepStatus(stage.status);
  const cfg = tone ?? getStepStatusConfig(isDark)[status];
  const Icon = icon ?? stageIconFor(stage.stage);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1.25,
        border: `1.4px solid ${cfg.borderColor}`,
        borderRadius: "10px",
        background: theme.palette.background.paper,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: "9px",
          background: cfg.bgColor,
          color: cfg.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label ?? formatStageName(stage.stage)}
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: cfg.color, mt: "2px" }}>
          {statusLabel ?? formatStatusLabel(stage.status)}
        </Typography>
      </Box>

      <StatusIcon status={status} size={20} />
    </Box>
  );
};

const Rail: React.FC<{ done?: boolean }> = ({ done }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: 0,
        height: 12,
        ml: "17px",
        borderLeft: `1.6px ${done ? "solid" : "dashed"} ${
          done ? theme.palette.success.main : theme.palette.divider
        }`,
      }}
    />
  );
};

const Lane: React.FC<{
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  count?: number;
  children: React.ReactNode;
}> = ({ label, icon: Icon, color, bgColor, count, children }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.875 }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "7px",
          background: bgColor,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 12 }} />
      </Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.7px", color }}>{label}</Typography>
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
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {count}
        </Box>
      )}
    </Box>
    <Box sx={{ display: "flex", flexDirection: "column" }}>{children}</Box>
  </Box>
);

const isDone = (row: CrqJourneyStageRow | null) => !!row && normalizeStepStatus(row.status) === "completed";

export const CrqFlowStacked: React.FC<{
  flow: CrqJourneyFlow;
  /** Built once by the canvas so both views label CAB / Conflict Check identically. */
  schedulingChain: SchedulingChainItem[];
  /** Service name / code → pending approver, so both views' cards name the same person. */
  approverIndex?: Map<string, PendingApprovalView>;
}> = ({ flow, schedulingChain, approverIndex }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { assignment, approvals, validate, impactAnalysis, mopCreate, mopValidate, implementation, closure } =
    flow;

  const tone = (base: string, darkText: string, lightText: string) => ({
    color: isDark ? darkText : lightText,
    bgColor: alpha(base, isDark ? 0.18 : 0.09),
  });
  const parallelTone = tone("#16A34A", "#5DCAA5", "#15803D");
  const approvalsTone = tone("#7C3AED", "#C4A6F5", "#6D28D9");
  const mopTone = tone("#1976D2", "#7FB4EE", "#1565C0");
  const schedulingTone = tone("#ED8B00", "#FAC775", "#C2410C");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25, pt: 1.5 }}>
      <Lane label="PARALLEL ACTIVITIES" icon={LinkRoundedIcon} {...parallelTone}>
        {assignment && <StageRow stage={assignment} />}
        {assignment && validate && <Rail done={isDone(assignment)} />}
        {validate && <StageRow stage={validate} />}
        {validate && impactAnalysis && <Rail done={isDone(validate)} />}
        {impactAnalysis && <StageRow stage={impactAnalysis} />}
      </Lane>

      <Lane
        label="APPROVALS TRIGGERED"
        icon={CheckCircleRoundedIcon}
        count={approvals.length}
        {...approvalsTone}
      >
        {approvals.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
              gap: 1,
            }}
          >
            {approvals.map((a, idx) => (
              <ApprovalCard
                key={`${a.stage}-${idx}`}
                approval={a}
                approver={approverIndex?.get(a.stage.trim().toUpperCase()) ?? null}
                width="100%"
                height={126}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              p: 1.5,
              border: `1.4px dashed ${isDark ? "rgba(196,166,245,0.45)" : "#B9A6F0"}`,
              borderRadius: "10px",
              background: isDark ? "rgba(124,58,237,0.06)" : "rgba(124,58,237,0.022)",
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 18, color: approvalsTone.color, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: approvalsTone.color }}>
                No service approvals triggered
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                Impact Analysis linked no CAB services to this CRQ.
              </Typography>
            </Box>
          </Box>
        )}
      </Lane>

      {(mopCreate || mopValidate) && (
        <Lane label="MOP" icon={DescriptionRoundedIcon} {...mopTone}>
          {mopCreate && <StageRow stage={mopCreate} />}
          {mopCreate && mopValidate && <Rail done={isDone(mopCreate)} />}
          {mopValidate && <StageRow stage={mopValidate} />}
        </Lane>
      )}

      {schedulingChain.length > 0 && (
        <Lane label="SCHEDULING & APPROVALS" icon={CalendarMonthRoundedIcon} {...schedulingTone}>
          {schedulingChain.map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 && <Rail done={schedulingChain[idx - 1].status === "completed"} />}
              <StageRow
                stage={item.row}
                label={item.label}
                statusLabel={item.statusLabel}
                tone={item.tone}
                status={item.status}
                icon={item.icon}
              />
            </React.Fragment>
          ))}
        </Lane>
      )}

      {(implementation || closure) && (
        <Lane
          label="EXECUTION"
          icon={PlayArrowRoundedIcon}
          color={theme.palette.primary.main}
          bgColor={alpha(theme.palette.primary.main, isDark ? 0.18 : 0.09)}
        >
          {implementation && <StageRow stage={implementation} />}
          {implementation && closure && <Rail done={isDone(implementation)} />}
          {closure && <StageRow stage={closure} />}
        </Lane>
      )}
    </Box>
  );
};
