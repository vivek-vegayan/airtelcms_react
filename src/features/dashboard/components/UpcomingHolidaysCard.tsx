import { Box, Card, Chip, Skeleton, Tooltip, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import type { Colors } from "../types/colorTypes";
import type { Holiday } from "../types/dashboard.types";
import type { DashboardHolidaysStatus } from "../hooks/useDashboardHolidays";
import { fadeIn, getCardSx, getToneStyles } from "../constants/dashboard.styles";
import { SectionHeader } from "./SectionHeader";

interface UpcomingHolidaysCardProps {
  holidays: readonly Holiday[];
  status: DashboardHolidaysStatus;
  errorMessage?: string;
  colors: Colors;
  mounted: boolean;
  delay: number;
}

export function UpcomingHolidaysCard({ holidays, status, errorMessage, colors, mounted, delay }: UpcomingHolidaysCardProps) {
  const tones = getToneStyles(colors);

  return (
    <Card sx={{ ...getCardSx(colors), p: "16px", ...fadeIn(mounted, delay) }}>
      <SectionHeader
        title="Upcoming holidays"
        colors={colors}
        right={
          <Typography sx={{ fontSize: 11, color: colors.accent, fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
            All
          </Typography>
        }
      />

      {status === "loading" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={54} sx={{ borderRadius: "10px" }} />
          ))}
        </Box>
      )}

      {status === "error" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "20px" }}>
          <ErrorOutlineIcon sx={{ fontSize: 24, color: colors.danger }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.danger, textAlign: "center" }}>
            {errorMessage}
          </Typography>
        </Box>
      )}

      {status === "empty" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "20px" }}>
          <EventBusyIcon sx={{ fontSize: 24, color: colors.textDim }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textDim, textAlign: "center" }}>
            No upcoming holidays
          </Typography>
        </Box>
      )}

      {status === "ready" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {holidays.map((h, i) => {
            const tone = tones[h.tone];
            return (
              <Tooltip key={i} title={`${h.name} — ${h.countdown} away`} arrow>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    p: "9px 10px",
                    borderRadius: "10px",
                    background: tone.light,
                    border: `1.5px solid ${tone.border}`,
                    cursor: "default",
                    transition: "all .2s",
                    "&:hover": { transform: "translateX(3px)", boxShadow: `0 4px 16px ${tone.border}` },
                  }}
                >
                  <Box
                    sx={{
                      background: tone.color,
                      borderRadius: "8px",
                      p: "5px 7px",
                      textAlign: "center",
                      minWidth: 36,
                      flexShrink: 0,
                      boxShadow: `0 3px 10px ${tone.border}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,.8)", letterSpacing: ".7px" }}>
                      {h.month}
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{h.day}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>{h.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: colors.textSecondary, mt: "1px" }}>{h.type}</Typography>
                  </Box>
                  <Chip
                    label={h.countdown}
                    size="small"
                    sx={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: tone.color,
                      background: colors.surface,
                      border: `1.5px solid ${tone.border}`,
                      borderRadius: "6px",
                      height: "auto",
                      "& .MuiChip-label": { px: "8px", py: "3px" },
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
