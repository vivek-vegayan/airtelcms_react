import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  IconButton,
  LinearProgress,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RouteIcon from "@mui/icons-material/Route";
import MemoryIcon from "@mui/icons-material/Memory";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { StageHistoryPanel } from "../../generic/StageHistoryPanel";

/* ───────────────────── types ───────────────────── */
interface PrevCrqStatusDialogProps {
  open: boolean;
  onClose: () => void;
  crqData: any | null;
  colors: any;
  /** Opens the Preview CRQ PDF dialog for crqData.crqNo - omitted entirely when not supplied. */
  onPreviewCrq?: () => void;
}

/* ───────────────────── helpers ───────────────────── */
const statusMeta = (status: string | null, colors: any) => {
  if (!status)
    return {
      bg: colors.trackOff,
      fg: colors.textDim,
      border: colors.border,
      pulse: false,
      progress: 0,
    };
  const s = status.toLowerCase();
  if (s.includes("progress"))
    return {
      bg: colors.infoDim,
      fg: colors.info,
      border: colors.infoBorder,
      pulse: true,
      progress: 50,
    };
  if (s.includes("complete") || s.includes("done"))
    return {
      bg: colors.successDim,
      fg: colors.success,
      border: colors.successBorder,
      pulse: false,
      progress: 100,
    };
  if (s.includes("pause") || s.includes("hold"))
    return {
      bg: colors.warningDim ?? "#fef3c7",
      fg: colors.warning ?? "#d97706",
      border: colors.warningBorder ?? "#fcd34d",
      pulse: false,
      progress: 35,
    };
  if (s.includes("not started"))
    return {
      bg: colors.trackOff,
      fg: colors.textDim,
      border: colors.border,
      pulse: false,
      progress: 0,
    };
  return {
    bg: colors.trackOff,
    fg: colors.textSecondary,
    border: colors.border,
    pulse: false,
    progress: 0,
  };
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ───────── reusable: glass‑card wrapper ───────── */
const GlassCard: React.FC<{
  children: React.ReactNode;
  colors: any;
  accent?: string;
  sx?: any;
}> = ({ children, colors, accent, sx }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: colors.radiusL ?? "12px",
      border: `1px solid ${accent ? `${accent}33` : colors.border}`,
      bgcolor: colors.isDark
        ? "rgba(255,255,255,0.02)"
        : "rgba(255,255,255,0.6)",
      backdropFilter: "blur(8px)",
      position: "relative",
      overflow: "hidden",
      "&::before": accent
        ? {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: 3,
            height: "100%",
            background: `linear-gradient(180deg, ${accent}, transparent)`,
            borderRadius: "3px 0 0 3px",
          }
        : {},
      ...sx,
    }}
  >
    {children}
  </Box>
);

/* ───────── reusable: section header ───────── */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  colors: any;
  badge?: string | number;
}> = ({ icon, title, colors, badge }) => (
  <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
    <Avatar
      sx={{
        width: 26,
        height: 26,
        bgcolor: colors.accentDim,
        color: colors.accent,
      }}
    >
      {icon}
    </Avatar>
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.6,
        color: colors.textSecondary,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Typography>
    {badge !== undefined && (
      <Chip
        label={badge}
        size="small"
        sx={{
          height: 18,
          fontSize: 10,
          fontWeight: 800,
          bgcolor: colors.accentDim,
          color: colors.accent,
          border: `1px solid ${colors.accentBorder}`,
        }}
      />
    )}
  </Stack>
);

/* ───────── reusable: key-value pill ───────── */
const KVPill: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  colors: any;
  mono?: boolean;
}> = ({ icon, label, value, colors, mono }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.6,
      px: 1.2,
      py: 0.5,
      m: 0.4,
      borderRadius: "8px",
      bgcolor: colors.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      border: `1px solid ${colors.border}`,
      minWidth: 0,
    }}
  >
    {icon && (
      <Box sx={{ display: "flex", color: colors.textDim, fontSize: 13 }}>
        {icon}
      </Box>
    )}
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 700,
        color: colors.textDim,
        textTransform: "uppercase",
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 600,
        color: colors.textPrimary,
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-all",
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

/* ═══════════════════════════════════════════════════
   MAIN DIALOG
   ═══════════════════════════════════════════════════ */
export const PrevCrqStatusDialog: React.FC<PrevCrqStatusDialogProps> = ({
  open,
  onClose,
  crqData,
  colors,
  onPreviewCrq,
}) => {
  if (!crqData) return null;

  // Real workflow data: the current stage entry (from crq.history) is
  // authoritative; legacy fields remain as fallback for old responses.
  const currentEntry = crqData.history?.find((h: any) => h.current) ?? null;
  const currentStageLabel = currentEntry?.stageLabel ?? "Review";
  const currentStageStatus = currentEntry?.status ?? crqData.crqReviewStatus;

  const crqMeta = statusMeta(crqData.crqStatus, colors);
  const reviewMeta = statusMeta(currentStageStatus, colors);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: colors.radiusXL ?? "16px",
          backgroundImage: "none",
          overflow: "hidden",
        },
      }}
    >
      {/* ──────── HEADER ──────── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: colors.isDark
            ? `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.06) 100%)`
            : `linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(59,130,246,0.04) 100%)`,
          borderBottom: `1px solid ${colors.border}`,
          py: 1.8,
          px: 2.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: colors.accent,
              boxShadow: `0 0 0 3px ${colors.accentDim}`,
            }}
          >
            <AssignmentIcon sx={{ fontSize: 18, color: "#fff" }} />
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 800,
                color: colors.textPrimary,
                lineHeight: 1.2,
              }}
            >
              CRQ Details
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                fontFamily: "monospace",
                color: colors.accent,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              {crqData.crqNo}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: colors.textDim,
            bgcolor: colors.trackOff,
            border: `1px solid ${colors.border}`,
            "&:hover": { bgcolor: colors.accentDim, color: colors.accent },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflowX: "hidden" }}>
        {/* ──────── STATUS HERO ──────── */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
            {/* CRQ Status Card */}
            <GlassCard colors={colors} accent={crqMeta.fg} sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: colors.textDim,
                  mb: 0.5,
                }}
              >
                CRQ Status
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.8}
                sx={{ mb: 1 }}
              >
                {crqMeta.pulse && (
                  <FiberManualRecordIcon
                    sx={{
                      fontSize: 10,
                      color: crqMeta.fg,
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.3 },
                      },
                    }}
                  />
                )}
                <Typography
                  sx={{ fontSize: 16, fontWeight: 800, color: crqMeta.fg }}
                >
                  {crqData.crqStatus ?? "N/A"}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={crqMeta.progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: `${crqMeta.fg}15`,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 2,
                    bgcolor: crqMeta.fg,
                  },
                }}
              />
            </GlassCard>

            {/* Review Status Card */}
            <GlassCard colors={colors} accent={reviewMeta.fg} sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: colors.textDim,
                  mb: 0.5,
                }}
              >
                {currentStageLabel} Status
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.8}
                sx={{ mb: 1 }}
              >
                {reviewMeta.pulse && (
                  <FiberManualRecordIcon
                    sx={{
                      fontSize: 10,
                      color: reviewMeta.fg,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
                <Typography
                  sx={{ fontSize: 16, fontWeight: 800, color: reviewMeta.fg }}
                >
                  {currentStageStatus ?? "N/A"}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={reviewMeta.progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: `${reviewMeta.fg}15`,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 2,
                    bgcolor: reviewMeta.fg,
                  },
                }}
              />
            </GlassCard>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: colors.border }} />

        {/* ──────── STAGE HISTORY (read-only, no actions) ──────── */}
        {(crqData.history?.length ?? 0) > 0 && (
          <>
            <Box sx={{ px: 2.5, py: 2 }}>
              <SectionHeader
                icon={<HistoryRoundedIcon sx={{ fontSize: 15 }} />}
                title="Previous Stage Status"
                colors={colors}
                badge={crqData.history.filter((h: any) => !h.current).length}
              />
              <StageHistoryPanel history={crqData.history} colors={colors} dense title="Completed Stages" />
            </Box>
            <Divider sx={{ borderColor: colors.border }} />
          </>
        )}

        {/* ──────── PLAN INFO ──────── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <SectionHeader
            icon={<AssignmentIcon sx={{ fontSize: 15 }} />}
            title="Plan Details"
            colors={colors}
          />
          <GlassCard colors={colors} accent={colors.accent}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "monospace",
                color: colors.accent,
                mb: 0.8,
                letterSpacing: 0.4,
              }}
            >
              {crqData.planNumber}
            </Typography>
            <Chip
              label={crqData.planType}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: colors.successDim,
                color: colors.success,
                border: `1px solid ${colors.successBorder}`,
              }}
            />
          </GlassCard>
        </Box>

        <Divider sx={{ borderColor: colors.border }} />

        {/* ──────── SCHEDULE TIMELINE ──────── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <SectionHeader
            icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />}
            title="Schedule"
            colors={colors}
          />
          <GlassCard colors={colors} accent={colors.info}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              {/* Start */}
              <Box sx={{ textAlign: "center", flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: colors.textDim,
                    mb: 0.3,
                  }}
                >
                  Start
                </Typography>
                <Typography
                  sx={{ fontSize: 13, fontWeight: 700, color: colors.info }}
                >
                  {formatTime(crqData.activityPlanStartDate)}
                </Typography>
                <Typography sx={{ fontSize: 10, color: colors.textDim }}>
                  {crqData.activityPlanStartDate
                    ? new Date(
                        crqData.activityPlanStartDate,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </Typography>
              </Box>

              {/* Arrow */}
              <Box
                sx={{
                  flex: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 2,
                    bgcolor: `${colors.info}30`,
                    borderRadius: 1,
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: "60%",
                      height: "100%",
                      bgcolor: colors.info,
                      borderRadius: 1,
                      animation: "progressPulse 2s ease-in-out infinite",
                      "@keyframes progressPulse": {
                        "0%": { width: "30%" },
                        "50%": { width: "70%" },
                        "100%": { width: "30%" },
                      },
                    }}
                  />
                </Box>
                <ArrowForwardIcon
                  sx={{
                    position: "absolute",
                    right: -4,
                    fontSize: 16,
                    color: colors.info,
                  }}
                />
              </Box>

              {/* End */}
              <Box sx={{ textAlign: "center", flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: colors.textDim,
                    mb: 0.3,
                  }}
                >
                  End
                </Typography>
                <Typography
                  sx={{ fontSize: 13, fontWeight: 700, color: colors.accent }}
                >
                  {formatTime(crqData.activityPlanEndDate)}
                </Typography>
                <Typography sx={{ fontSize: 10, color: colors.textDim }}>
                  {crqData.activityPlanEndDate
                    ? new Date(crqData.activityPlanEndDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "—"}
                </Typography>
              </Box>
            </Stack>
          </GlassCard>
        </Box>

        <Divider sx={{ borderColor: colors.border }} />

        {/* ──────── LOCATION & EQUIPMENT ──────── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <SectionHeader
            icon={<LocationOnIcon sx={{ fontSize: 15 }} />}
            title="Location & Equipment"
            colors={colors}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", mx: -0.4 }}>
            <KVPill
              icon={<MemoryIcon sx={{ fontSize: 13 }} />}
              label="NE"
              value={crqData.neLabel}
              colors={colors}
              mono
            />
            <KVPill
              icon={<LocationOnIcon sx={{ fontSize: 13 }} />}
              label="Location"
              value={crqData.locationCodeM6}
              colors={colors}
              mono
            />
            <KVPill
              icon={<RouteIcon sx={{ fontSize: 13 }} />}
              label="Work Area"
              value={crqData.workAreaTerritory}
              colors={colors}
            />
            <KVPill
              label="Activity"
              value={crqData.taskActivity}
              colors={colors}
            />
            <KVPill
              label="Profile"
              value={crqData.taskProfileType}
              colors={colors}
            />
          </Box>
        </Box>

        {/* ──────── TASKS TIMELINE ──────── */}
        {crqData.tasks?.length > 0 && (
          <>
            <Divider sx={{ borderColor: colors.border }} />
            <Box sx={{ px: 2.5, py: 2 }}>
              <SectionHeader
                icon={<TaskAltIcon sx={{ fontSize: 15 }} />}
                title="Tasks"
                badge={crqData.tasks.length}
                colors={colors}
              />
              {crqData.tasks.map((task: any, idx: number) => (
                <GlassCard
                  key={task.taskId}
                  colors={colors}
                  accent={colors.accent}
                  sx={{ mb: 1.2 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1.2 }}
                  >
                    <Avatar
                      sx={{
                        width: 22,
                        height: 22,
                        bgcolor: colors.accentDim,
                        color: colors.accent,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {idx + 1}
                    </Avatar>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: colors.accent,
                        letterSpacing: 0.3,
                      }}
                    >
                      {task.taskId}
                    </Typography>
                  </Stack>
                  <Box sx={{ display: "flex", flexWrap: "wrap", mx: -0.4 }}>
                    <KVPill
                      icon={<MemoryIcon sx={{ fontSize: 12 }} />}
                      label="NE"
                      value={task.neLabel}
                      colors={colors}
                      mono
                    />
                    <KVPill
                      label="Activity"
                      value={task.planActivityDetails}
                      colors={colors}
                    />
                    <KVPill
                      icon={<LocationOnIcon sx={{ fontSize: 12 }} />}
                      label="Loc"
                      value={task.locationCodeM6}
                      colors={colors}
                      mono
                    />
                    <KVPill
                      icon={<RouteIcon sx={{ fontSize: 12 }} />}
                      label="Area"
                      value={task.workAreaTerritory}
                      colors={colors}
                    />
                    <KVPill
                      icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                      label="Start"
                      value={formatDate(task.activityPlanStartDate)}
                      colors={colors}
                    />
                    <KVPill
                      icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                      label="End"
                      value={formatDate(task.activityPlanEndDate)}
                      colors={colors}
                    />
                  </Box>
                </GlassCard>
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      {/* ──────── FOOTER ──────── */}
      <DialogActions
        sx={{
          borderTop: `1px solid ${colors.border}`,
          px: 2.5,
          py: 1.5,
          background: colors.isDark
            ? `linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 100%)`
            : `linear-gradient(135deg, rgba(99,102,241,0.03) 0%, transparent 100%)`,
        }}
      >
        {onPreviewCrq && (
          <Button
            onClick={onPreviewCrq}
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfOutlinedIcon sx={{ fontSize: 15 }} />}
            sx={{
              fontSize: 12,
              fontWeight: 700,
              borderRadius: "8px",
              textTransform: "none",
              borderColor: colors.accentBorder,
              color: colors.accent,
              "&:hover": {
                borderColor: colors.accent,
                bgcolor: colors.accentDim,
              },
            }}
          >
            Pdf View
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            fontSize: 12,
            fontWeight: 700,
            borderRadius: "8px",
            textTransform: "none",
            borderColor: colors.border,
            color: colors.textSecondary,
            "&:hover": {
              borderColor: colors.accentBorder,
              bgcolor: colors.accentDim,
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
