import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import type {
  ActionStatusFilter,
  ReadStatusFilter,
  RescheduleSummaryCounts,
} from "../types/rescheduleNotification.types";
import type { Colors } from "../types/colorTypes";
import { getSummaryTileAccents } from "../constants/rescheduleNotification.styles";

interface SummaryTileConfig {
  key: string;
  label: string;
  value: number;
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
}

interface RescheduleNotificationSummaryProps {
  counts: RescheduleSummaryCounts;
  readFilter: ReadStatusFilter;
  actionFilter: ActionStatusFilter;
  colors: Colors;
  onSelectAll: () => void;
  onSelectUnread: () => void;
  onSelectPending: () => void;
  onSelectApproved: () => void;
  onSelectRejected: () => void;
}

export function RescheduleNotificationSummary({
  counts,
  readFilter,
  actionFilter,
  colors,
  onSelectAll,
  onSelectUnread,
  onSelectPending,
  onSelectApproved,
  onSelectRejected,
}: RescheduleNotificationSummaryProps) {
  const isAllActive = readFilter === "ALL" && actionFilter === "ALL";
  const accents = getSummaryTileAccents(colors);

  const tiles: SummaryTileConfig[] = [
    {
      key: "total",
      label: "Total Requests",
      value: counts.total,
      isActive: isAllActive,
      onClick: onSelectAll,
      icon: <InboxIcon sx={{ fontSize: 14 }} />,
    },
    {
      key: "unread",
      label: "Unread",
      value: counts.unread,
      isActive: readFilter === "UNREAD",
      onClick: onSelectUnread,
      icon: <MarkEmailUnreadIcon sx={{ fontSize: 14 }} />,
    },
    {
      key: "pending",
      label: "Pending",
      value: counts.pending,
      isActive: actionFilter === "PENDING",
      onClick: onSelectPending,
      icon: <HourglassTopIcon sx={{ fontSize: 14 }} />,
    },
    {
      key: "approved",
      label: "Approved",
      value: counts.approved,
      isActive: actionFilter === "APPROVED",
      onClick: onSelectApproved,
      icon: <TaskAltIcon sx={{ fontSize: 14 }} />,
    },
    {
      key: "rejected",
      label: "Rejected",
      value: counts.rejected,
      isActive: actionFilter === "REJECTED",
      onClick: onSelectRejected,
      icon: <HighlightOffIcon sx={{ fontSize: 14 }} />,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
        gap: "8px",
      }}
    >
      {tiles.map((tile) => {
        const accent = accents[tile.key];
        return (
          <Box
            key={tile.key}
            onClick={tile.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") tile.onClick();
            }}
            aria-pressed={tile.isActive}
            sx={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "10px",
              border: `1.5px solid ${tile.isActive ? accent.color : colors.border}`,
              background: tile.isActive ? accent.light : colors.surface,
              p: "9px 10px",
              transition: "box-shadow .2s, border-color .2s, transform .2s",
              "&:hover": {
                boxShadow: colors.isDark ? "0 8px 20px rgba(0,0,0,.4)" : "0 8px 22px rgba(60,60,140,.10)",
                borderColor: accent.color,
                transform: "translateY(-2px)",
              },
              "&:focus-visible": { outline: `2px solid ${accent.color}`, outlineOffset: 1 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                mb: "6px",
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "7px",
                  background: accent.light,
                  color: accent.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {tile.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: colors.textSecondary,
                  letterSpacing: ".3px",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                {tile.label}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 19, fontWeight: 900, color: colors.textPrimary, lineHeight: 1, letterSpacing: "-0.5px" }}>
              {tile.value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
