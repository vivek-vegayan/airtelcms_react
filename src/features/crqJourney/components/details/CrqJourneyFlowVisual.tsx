import React, { useMemo } from "react";
import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import type { CrqDetailsStage } from "../../types/crqJourney.types";
import { formatDateTime, formatStageCode, formatStatusLabel, normalizeStepStatus, getStepStatusConfig } from "../../utils/crqJourney.utils";
import { getStageIcon } from "../../utils/stageIcons";

interface CrqJourneyFlowVisualProps {
  stages: CrqDetailsStage[];
}

const RING_SIZE = 76;
const RING_STROKE = 7;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

const ProgressRing: React.FC<{ pct: number; completed: number; total: number }> = ({ pct, completed, total }) => {
  const theme = useTheme();
  const gradId = "crqRingGrad";
  return (
    <Box sx={{ position: "relative", width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.palette.primary.main} />
            <stop offset="100%" stopColor={theme.palette.success.main} />
          </linearGradient>
        </defs>
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke={theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.08)"}
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C - (RING_C * pct) / 100}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: "text.primary", lineHeight: 1 }}>{pct}%</Typography>
        <Typography sx={{ fontSize: 9, color: "text.secondary", fontWeight: 600 }}>
          {completed}/{total}
        </Typography>
      </Box>
    </Box>
  );
};

const StageNode: React.FC<{ stage: CrqDetailsStage; index: number }> = ({ stage, index }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const status = normalizeStepStatus(stage.stageStatus);
  const cfg = getStepStatusConfig(isDark)[status];
  const Icon = getStageIcon(stage.stage);
  const isCurrent = stage.isCurrent;
  const dim = status === "not_started";

  const metaLine =
    stage.performedBy ?? stage.assignedTo ?? (stage.stageStartDate ? formatDateTime(stage.stageStartDate) : null);

  return (
    <Tooltip
      arrow
      title={
        <Box sx={{ p: 0.25 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{formatStageCode(stage.stage)}</Typography>
          <Typography sx={{ fontSize: 11 }}>{formatStatusLabel(stage.stageStatus)}</Typography>
          {stage.assignedTo && <Typography sx={{ fontSize: 11 }}>Assigned: {stage.assignedTo}</Typography>}
          {stage.performedBy && <Typography sx={{ fontSize: 11 }}>Performed by: {stage.performedBy}</Typography>}
        </Box>
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          alignItems: "center",
          gap: { xs: 1.5, md: 0.75 },
          minWidth: { md: 108 },
          px: 1,
          py: { xs: 1, md: 0 },
          borderRadius: "12px",
          cursor: "default",
          transition: "background 0.15s ease, transform 0.15s ease",
          "&:hover": {
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(13,27,42,0.03)",
            transform: { md: "translateY(-2px)" },
          },
        }}
      >
        {/* icon node */}
        <Box
          sx={{
            position: "relative",
            width: 52,
            height: 52,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isCurrent && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: cfg.color,
                opacity: 0.22,
                animation: "crqFlowPulse 1.8s ease-in-out infinite",
                "@keyframes crqFlowPulse": {
                  "0%, 100%": { transform: "scale(1)", opacity: 0.22 },
                  "50%": { transform: "scale(1.35)", opacity: 0.05 },
                },
              }}
            />
          )}
          <Box
            sx={{
              position: "relative",
              width: 46,
              height: 46,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: dim ? (isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9") : cfg.bgColor,
              border: `2px solid ${dim ? theme.palette.divider : cfg.color}`,
              boxShadow: isCurrent ? `0 0 0 4px ${cfg.color}22` : "none",
            }}
          >
            <Icon sx={{ fontSize: 21, color: dim ? "text.disabled" : cfg.color }} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 17,
              height: 17,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#fff",
              background: dim ? theme.palette.text.disabled : cfg.color,
              border: `2px solid ${theme.palette.background.paper}`,
            }}
          >
            {index + 1}
          </Box>
        </Box>

        {/* label */}
        <Box sx={{ textAlign: { xs: "left", md: "center" }, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: isCurrent ? 700 : 600,
              color: isCurrent ? theme.palette.primary.main : "text.primary",
              whiteSpace: { md: "nowrap" },
            }}
          >
            {formatStageCode(stage.stage)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: dim ? "text.disabled" : cfg.color, fontWeight: 600, mt: "1px" }}>
            {formatStatusLabel(stage.stageStatus)}
          </Typography>
          {metaLine && (
            <Typography
              sx={{
                fontSize: 9.5,
                color: "text.disabled",
                mt: "1px",
                maxWidth: { md: 108 },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {metaLine}
            </Typography>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};

const Connector: React.FC<{ filled: boolean; active: boolean }> = ({ filled, active }) => {
  const theme = useTheme();
  const color = filled ? theme.palette.success.main : theme.palette.divider;

  return (
    <>
      {/* horizontal — desktop */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          flex: 1,
          minWidth: 20,
          height: 3,
          borderRadius: "999px",
          alignSelf: "center",
          mt: "-20px",
          position: "relative",
          overflow: "hidden",
          background: filled ? color : `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 12px)`,
        }}
      >
        {active && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, transparent, ${theme.palette.primary.light}, transparent)`,
              backgroundSize: "60% 100%",
              animation: "crqFlowShimmer 1.6s linear infinite",
              "@keyframes crqFlowShimmer": {
                from: { backgroundPositionX: "-60%" },
                to: { backgroundPositionX: "160%" },
              },
            }}
          />
        )}
      </Box>
      {/* vertical — mobile */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          width: 3,
          height: 18,
          ml: "26px",
          borderRadius: "999px",
          background: filled ? color : `repeating-linear-gradient(180deg, ${color} 0 6px, transparent 6px 12px)`,
        }}
      />
    </>
  );
};

export const CrqJourneyFlowVisual: React.FC<CrqJourneyFlowVisualProps> = ({ stages }) => {
  const progress = useMemo(() => {
    const completed = stages.filter((s) => normalizeStepStatus(s.stageStatus) === "completed").length;
    return { completed, total: stages.length, pct: stages.length ? Math.round((completed / stages.length) * 100) : 0 };
  }, [stages]);

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: { xs: 2, sm: 3.5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>
        <ProgressRing pct={progress.pct} completed={progress.completed} total={progress.total} />
        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Overall Progress</Typography>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
            {progress.completed} of {progress.total} stages complete
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: { xs: 0, md: 0.5 },
          overflowX: { md: "auto" },
          py: { md: 2.5 },
          "&::-webkit-scrollbar": { height: 5 },
        }}
      >
        {stages.map((stage, idx) => {
          const status = normalizeStepStatus(stage.stageStatus);
          const isLast = idx === stages.length - 1;
          return (
            <React.Fragment key={stage.stage}>
              <StageNode stage={stage} index={idx} />
              {!isLast && <Connector filled={status === "completed"} active={stage.isCurrent} />}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};
