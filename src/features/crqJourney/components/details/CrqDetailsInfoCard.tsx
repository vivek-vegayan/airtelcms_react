import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import type { CrqDetailsInfo, CrqDetailsStage } from "../../types/crqJourney.types";
import { formatDateTime, formatStatusLabel, normalizeStepStatus, statusChipColor } from "../../utils/crqJourney.utils";

interface CrqDetailsInfoCardProps {
  info: CrqDetailsInfo;
  /** Optional — when supplied, renders a "X of N stages complete" progress bar in the header. */
  stages?: CrqDetailsStage[];
}

const Field = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", gap: 1.25, minWidth: 0 }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: "9px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(13,27,42,0.04)",
        }}
      >
        <Icon sx={{ fontSize: 15, color: "text.secondary" }} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
        <Typography sx={{ fontSize: 10.5, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "text.primary", wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export const CrqDetailsInfoCard: React.FC<CrqDetailsInfoCardProps> = ({ info, stages }) => {
  const theme = useTheme();
  const chip = statusChipColor(info.currentStatus, theme.palette.mode === "dark");

  const progress = useMemo(() => {
    if (!stages || stages.length === 0) return null;
    const completed = stages.filter((s) => normalizeStepStatus(s.stageStatus) === "completed").length;
    return { completed, total: stages.length, pct: Math.round((completed / stages.length) * 100) };
  }, [stages]);

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: theme.palette.mode === "dark" ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(16,40,70,0.05)",
        overflow: "hidden",
        animation: "crqCardFadeIn 0.3s ease-out",
        "@keyframes crqCardFadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* accent header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          background: chip.bg,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          sx={{ fontFamily: "Roboto Mono, monospace", fontSize: 15, fontWeight: 700, color: theme.palette.primary.main }}
        >
          {info.crqNo}
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: 11.5,
            fontWeight: 700,
            color: chip.color,
            background: theme.palette.background.paper,
            border: `1px solid ${chip.color}33`,
            borderRadius: "999px",
            px: "10px",
            py: "3px",
          }}
        >
          <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", background: chip.dot }} />
          {formatStatusLabel(info.currentStatus)}
        </Box>

        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          Current stage: <strong>{info.currentStage}</strong>
        </Typography>

        {progress && (
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, minWidth: 160 }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}>
              {progress.completed}/{progress.total} stages
            </Typography>
            <Box
              sx={{
                width: 90,
                height: 6,
                borderRadius: "999px",
                background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.08)",
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
            {progress.pct === 100 && <CheckIcon sx={{ fontSize: 15, color: theme.palette.success.main }} />}
          </Box>
        )}
      </Box>

      {/* field grid */}
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 2.5,
        }}
      >
        <Field icon={BusinessCenterIcon} label="Team Function" value={info.teamFunction ?? "—"} />
        <Field icon={AccountTreeIcon} label="Team Sub-Function" value={info.teamSubFunction ?? "—"} />
        <Field icon={CalendarMonthIcon} label="Created On" value={formatDateTime(info.createdDate)} />
        <Field icon={ChatBubbleOutlineIcon} label="Remark" value={info.remark?.trim() ? info.remark : "—"} />
      </Box>
    </Box>
  );
};
