import React, { useMemo, useRef, useState } from "react";
import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EngineeringIcon from "@mui/icons-material/Engineering";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TimerIcon from "@mui/icons-material/Timer";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ViewListIcon from "@mui/icons-material/ViewList";
import type { CrqDetailsStage } from "../../types/crqJourney.types";
import { formatDateTime, formatStageCode, formatStatusLabel, normalizeStepStatus, getStepStatusConfig } from "../../utils/crqJourney.utils";
import { getStageIcon } from "../../utils/stageIcons";
import { StatusIcon } from "../StepStatusBadge";
import { CrqJourneyFlowVisual } from "./CrqJourneyFlowVisual";

interface CrqStageTimelineProps {
  stages: CrqDetailsStage[];
}

type ViewMode = "visual" | "list";

const formatDuration = (startRaw: string | null, endRaw: string | null): string | null => {
  if (!startRaw || !endRaw) return null;
  const start = new Date(startRaw).getTime();
  const end = new Date(endRaw).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
};

const MetaRow = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    <Icon sx={{ fontSize: 14, color: "text.disabled" }} />
    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{children}</Typography>
  </Box>
);

export const CrqStageTimeline: React.FC<CrqStageTimelineProps> = ({ stages }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [flashStage, setFlashStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

  const progress = useMemo(() => {
    const completed = stages.filter((s) => normalizeStepStatus(s.stageStatus) === "completed").length;
    return { completed, total: stages.length, pct: stages.length ? Math.round((completed / stages.length) * 100) : 0 };
  }, [stages]);

  const jumpToStage = (stageCode: string) => {
    const el = rowRefs.current[stageCode];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashStage(stageCode);
    window.setTimeout(() => setFlashStage((cur) => (cur === stageCode ? null : cur)), 1200);
  };

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(16,40,70,0.05)",
        p: "20px 24px",
      }}
    >
      {/* header + view toggle */}
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: viewMode === "visual" ? 1.5 : 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "text.primary" }}>
          Workflow Timeline
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            p: "3px",
            borderRadius: "999px",
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(13,27,42,0.045)",
            gap: "2px",
          }}
        >
          {(
            [
              { key: "visual", label: "Visual", icon: AccountTreeIcon },
              { key: "list", label: "List", icon: ViewListIcon },
            ] as const
          ).map(({ key, label, icon: ModeIcon }) => {
            const active = viewMode === key;
            return (
              <Box
                key={key}
                onClick={() => setViewMode(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setViewMode(key)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  px: "12px",
                  py: "5px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: active ? theme.palette.primary.contrastText : "text.secondary",
                  background: active ? theme.palette.primary.main : "transparent",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                <ModeIcon sx={{ fontSize: 14 }} />
                {label}
              </Box>
            );
          })}
        </Box>

        {viewMode === "list" && (
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, minWidth: 180 }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}>
              {progress.completed}/{progress.total} complete
            </Typography>
            <Box
              sx={{
                width: 110,
                height: 6,
                borderRadius: "999px",
                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.08)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  borderRadius: "999px",
                  width: `${progress.pct}%`,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  transition: "width 0.6s ease-out",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {viewMode === "visual" && (
        <Box sx={{ py: { xs: 1, sm: 2 } }}>
          <CrqJourneyFlowVisual stages={stages} />
        </Box>
      )}

      {viewMode === "list" && (
        <>
      {/* mini-stepper nav — click to jump to a stage below */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          pb: 2,
          mb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          "&::-webkit-scrollbar": { height: 4 },
        }}
      >
        {stages.map((stage, idx) => {
          const status = normalizeStepStatus(stage.stageStatus);
          const cfg = getStepStatusConfig(isDark)[status];
          const Icon = getStageIcon(stage.stage);
          const isLast = idx === stages.length - 1;
          return (
            <React.Fragment key={`nav-${stage.stage}`}>
              <Tooltip title={formatStageCode(stage.stage)} arrow>
                <Box
                  onClick={() => jumpToStage(stage.stage)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && jumpToStage(stage.stage)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    flexShrink: 0,
                    px: 0.5,
                    outline: "none",
                    "&:hover .crqNavCircle": {
                      transform: "scale(1.12)",
                      boxShadow: `0 0 0 4px ${cfg.color}22`,
                    },
                  }}
                >
                  <Box
                    className="crqNavCircle"
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: status === "not_started" ? (isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9") : cfg.bgColor,
                      border: `1.5px solid ${status === "not_started" ? theme.palette.divider : cfg.color}`,
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    <Icon sx={{ fontSize: 15, color: status === "not_started" ? "text.disabled" : cfg.color }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 9.5,
                      fontWeight: stage.isCurrent ? 700 : 500,
                      color: stage.isCurrent ? theme.palette.primary.main : "text.disabled",
                      whiteSpace: "nowrap",
                      maxWidth: 64,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {idx + 1}. {formatStageCode(stage.stage)}
                  </Typography>
                </Box>
              </Tooltip>
              {!isLast && (
                <Box
                  sx={{
                    height: "1.5px",
                    flex: 1,
                    minWidth: 16,
                    mb: 2,
                    background: status === "completed" ? cfg.color : theme.palette.divider,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      <Box>
        {stages.map((stage, idx) => {
          const status = normalizeStepStatus(stage.isCurrent ? stage.stageStatus : stage.stageStatus);
          const cfg = getStepStatusConfig(isDark)[status];
          const isLast = idx === stages.length - 1;
          const hasActivity = stage.assignedTo || stage.performedBy || stage.assignStart || stage.stageStartDate;
          const duration = formatDuration(stage.stageStartDate, stage.stageEndDate);
          const isFlashing = flashStage === stage.stage;

          return (
            <Box
              key={stage.stage}
              ref={(el: HTMLDivElement | null) => {
                rowRefs.current[stage.stage] = el;
              }}
              sx={{
                display: "flex",
                gap: 2,
                borderRadius: "10px",
                px: 1,
                ml: -1,
                transition: "background 0.5s ease, box-shadow 0.3s ease",
                background: isFlashing
                  ? `${theme.palette.primary.main}14`
                  : stage.isCurrent
                  ? (isDark ? "rgba(255,255,255,0.035)" : "rgba(13,27,42,0.02)")
                  : "transparent",
                boxShadow: isFlashing ? `0 0 0 2px ${theme.palette.primary.main}55` : "none",
                "&:hover": {
                  background: isDark ? "rgba(255,255,255,0.035)" : "rgba(13,27,42,0.02)",
                },
              }}
            >
              {/* node + connector */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, pt: 1 }}>
                <StatusIcon status={status} size={26} />
                {!isLast && (
                  <Box
                    sx={{
                      width: "2px",
                      flexGrow: 1,
                      minHeight: 28,
                      background: status === "completed" ? cfg.color : theme.palette.divider,
                      my: "4px",
                    }}
                  />
                )}
              </Box>

              {/* content */}
              <Box sx={{ flex: 1, pb: isLast ? 1 : 2.5, pt: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: stage.isCurrent ? 700 : 600,
                      color: stage.isCurrent ? theme.palette.primary.main : "text.primary",
                    }}
                  >
                    {formatStageCode(stage.stage)}
                  </Typography>
                  <Box
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: cfg.color,
                      background: cfg.bgColor,
                      border: `1px solid ${cfg.color}33`,
                      borderRadius: "999px",
                      px: "8px",
                      py: "1px",
                    }}
                  >
                    {formatStatusLabel(stage.stageStatus)}
                  </Box>
                  {stage.isCurrent && (
                    <Box
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.4px",
                        color: theme.palette.primary.main,
                        background: `${theme.palette.primary.main}1A`,
                        borderRadius: "999px",
                        px: "8px",
                        py: "1px",
                      }}
                    >
                      CURRENT
                    </Box>
                  )}
                  {duration && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "3px", color: "text.disabled" }}>
                      <TimerIcon sx={{ fontSize: 12.5 }} />
                      <Typography sx={{ fontSize: 10.5, fontWeight: 600 }}>{duration}</Typography>
                    </Box>
                  )}
                </Box>

                {hasActivity ? (
                  <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
                    {stage.assignedTo && <MetaRow icon={PersonIcon}>Assigned to {stage.assignedTo}</MetaRow>}
                    {stage.performedBy && <MetaRow icon={EngineeringIcon}>Performed by {stage.performedBy}</MetaRow>}
                    {(stage.assignStart || stage.assignEnd) && (
                      <MetaRow icon={ScheduleIcon}>
                        Assigned {formatDateTime(stage.assignStart)} → {formatDateTime(stage.assignEnd)}
                      </MetaRow>
                    )}
                    {(stage.stageStartDate || stage.stageEndDate) && (
                      <MetaRow icon={ScheduleIcon}>
                        Active {formatDateTime(stage.stageStartDate)} → {formatDateTime(stage.stageEndDate)}
                      </MetaRow>
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5, fontStyle: "italic" }}>
                    No activity yet
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
        </>
      )}
    </Box>
  );
};
