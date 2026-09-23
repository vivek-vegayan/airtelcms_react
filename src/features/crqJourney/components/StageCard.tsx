import React from "react";
import { Box, Typography, Paper, Tooltip, useTheme, alpha } from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import type { CrqJourneyStageRow } from "../types/crqJourney.types";
import {
  getStepStatusConfig,
  formatStageName,
  formatStatusLabel,
  normalizeStepStatus,
} from "../utils/crqJourney.utils";
import { StatusIcon, StepStatusBadge } from "./StepStatusBadge";

// Keyed by the raw stage value the proc emits — both the current spellings and
// the older ones, so the icon never falls back to the generic flag.
const STAGE_ICON_MAP: Record<string, React.ElementType> = {
  "SPOC/FE ASSIGNMENT": GroupsRoundedIcon,
  "PLAN & INVENTORY": AssignmentTurnedInRoundedIcon,
  "PLAN AND INVENTORY": AssignmentTurnedInRoundedIcon,
  VALIDATE: AssignmentTurnedInRoundedIcon,
  "IMPACT ANALYSIS": BarChartRoundedIcon,
  "MOP CREATE": DescriptionRoundedIcon,
  "MOP VALIDATE": DescriptionRoundedIcon,
  SCHEDULING: CalendarMonthRoundedIcon,
  ACTIVITY_IMPLEMENT: BuildRoundedIcon,
  "ACTIVITY IMPLEMENT": BuildRoundedIcon,
  IMPLEMENTATION: BuildRoundedIcon,
  CLOSURE: CheckCircleOutlineRoundedIcon,
};

export const stageIconFor = (stage: string): React.ElementType =>
  STAGE_ICON_MAP[stage.trim().toUpperCase()] ?? FlagRoundedIcon;

interface StageCardProps {
  stage: CrqJourneyStageRow;
  compact?: boolean;
  /** Canvas-driven size — the flow layout owns these numbers so cards and connectors stay aligned. */
  width?: number | string;
  height?: number | string;
}

/** Single canonical/assignment stage — used for every fixed (non-dynamic) slot in the journey flow. */
export const StageCard: React.FC<StageCardProps> = ({ stage, compact = false, width, height }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const status = normalizeStepStatus(stage.status);
  const cfg = getStepStatusConfig(isDark)[status];
  const Icon = stageIconFor(stage.stage);
  const isActive = status === "in_progress";

  return (
    <Tooltip title={`${stage.stage} — ${formatStatusLabel(stage.status)}`} arrow enterDelay={400} describeChild>
      <Paper
        elevation={0}
        sx={{
          width: width ?? (compact ? 132 : 148),
          height: height ?? "auto",
          minHeight: height ? undefined : isActive ? 90 : 80,
          border: `${isActive ? "1.6px" : "1.5px"} solid ${cfg.borderColor}`,
          borderRadius: "11px",
          p: "11px 12px",
          position: "relative",
          overflow: "hidden",
          background: isActive
            ? isDark
              ? "linear-gradient(180deg, rgba(25,118,210,0.24), rgba(25,118,210,0.08))"
              : "linear-gradient(180deg, #F2F7FE, #E7F0FD)"
            : theme.palette.background.paper,
          boxShadow: isActive
            ? isDark
              ? "0 4px 16px rgba(0,0,0,0.45)"
              : "0 4px 16px rgba(25,118,210,0.18)"
            : "none",
          transition: "box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
          flexShrink: 0,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDark ? "0 8px 22px rgba(0,0,0,0.5)" : "0 8px 22px rgba(16,40,70,0.14)",
            borderColor: alpha(cfg.color, 0.75),
          },
        }}
      >
        {/* The running stage gets the reference's animated top rail + light sweep. */}
        {isActive && (
          <>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${cfg.color}, ${alpha(cfg.color, 0.35)}, ${cfg.color})`,
                backgroundSize: "200% 100%",
                animation: "crqSlide 2.2s linear infinite",
                "@keyframes crqSlide": { to: { backgroundPosition: "200% 0" } },
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: "48%",
                pointerEvents: "none",
                background: `linear-gradient(100deg, transparent, ${
                  isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.65)"
                }, transparent)`,
                animation: "crqShimmer 2.8s ease-in-out infinite",
                "@keyframes crqShimmer": {
                  "0%": { transform: "translateX(-130%)" },
                  "55%, 100%": { transform: "translateX(260%)" },
                },
              }}
            />
          </>
        )}

        <Box sx={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 1.1 }}>
          <Icon sx={{ fontSize: 19, color: cfg.color, flexShrink: 0, mt: "1px" }} />
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: isActive ? 700 : 600,
              color: isActive ? cfg.color : "text.primary",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {formatStageName(stage.stage)}
          </Typography>
        </Box>

        <StepStatusBadge status={status} label={formatStatusLabel(stage.status)} />

        <Box sx={{ position: "absolute", right: 10, bottom: 10 }}>
          <StatusIcon status={status} size={20} />
        </Box>
      </Paper>
    </Tooltip>
  );
};
