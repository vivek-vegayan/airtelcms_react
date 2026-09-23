import { Box, Card, Chip, Skeleton, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { format, parseISO } from "date-fns";
import type { Colors } from "../types/colorTypes";
import type { EngineerDailyAssignmentRow, ToneKey } from "../types/dashboard.types";
import type { DashboardAssignmentsStatus } from "../hooks/useDashboardAssignments";
import { fadeIn, getCardSx, getInnerScrollSx, getToneStyles } from "../constants/dashboard.styles";
import { RadialProgress } from "./RadialProgress";
import { SectionHeader } from "./SectionHeader";

interface TodaysAssignmentsCardProps {
  assignments: readonly EngineerDailyAssignmentRow[];
  doneCount: number;
  totalCount: number;
  status: DashboardAssignmentsStatus;
  errorMessage?: string;
  colors: Colors;
  mounted: boolean;
  delay: number;
}

function toneForRemark(remark: string): ToneKey {
  if (remark === "Done") return "success";
  if (remark === "CRQ number not generated" || remark === "Deployment/Operations Task Not Closed") return "warning";
  return "accent";
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "h:mm a");
  } catch {
    return "—";
  }
}

export function TodaysAssignmentsCard({
  assignments,
  doneCount,
  totalCount,
  status,
  errorMessage,
  colors,
  mounted,
  delay,
}: TodaysAssignmentsCardProps) {
  const tones = getToneStyles(colors);
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card
      sx={{
        ...getCardSx(colors),
        p: { xs: "14px", sm: "16px" },
        height: "100%",
        minHeight: { xs: 180, lg: 248 },
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        ...fadeIn(mounted, delay),
      }}
    >
      <SectionHeader
        title="Today's assignments"
        subtitle={totalCount === 0 ? "Nothing scheduled" : `${totalCount - doneCount} remaining · ${doneCount} done`}
        colors={colors}
        right={
          totalCount > 0 ? (
            <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <RadialProgress value={doneCount} max={totalCount} size={40} stroke={4} color={colors.accent} trackColor={colors.surface2} />
              <Typography sx={{ position: "absolute", fontSize: 10, fontWeight: 800, color: colors.textPrimary }}>
                {pct}%
              </Typography>
            </Box>
          ) : undefined
        }
      />

      {status === "loading" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={54} sx={{ borderRadius: "10px" }} />
          ))}
        </Box>
      )}

      {status === "error" && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "22px" }}>
          <ErrorOutlineIcon sx={{ fontSize: 26, color: colors.danger }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.danger, textAlign: "center" }}>
            {errorMessage}
          </Typography>
        </Box>
      )}

      {status === "empty" && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "22px", my: "auto" }}>
          <EventAvailableIcon sx={{ fontSize: 30, color: colors.accentBorder }} />
          <Typography sx={{ color: colors.textDim, fontSize: 12, fontWeight: 600 }}>Nothing assigned for today</Typography>
        </Box>
      )}

      {status === "ready" && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            // Capped so a busy day cannot stretch this card — and with it the
            // KPI tiles sharing its grid row — into a wall of dead space.
            maxHeight: 300,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            overflowY: "auto",
            // Room for the hover nudge below, so the rows don't clip sideways.
            pr: "2px",
            ...getInnerScrollSx(colors),
          }}
        >
          {assignments.map((a, i) => {
            const tone = tones[toneForRemark(a.remark)];
            return (
              <Box
                key={`${a.planNo}-${i}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: "6px", sm: "10px" },
                  p: { xs: "8px 9px", sm: "9px 10px" },
                  borderRadius: "10px",
                  background: colors.surface2,
                  border: `1.5px solid ${colors.border}`,
                  transition: "all .18s",
                  flexShrink: 0,
                  "&:hover": { borderColor: colors.accentBorder, transform: "translateX(3px)" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }} noWrap>
                    {a.crqNo ?? a.planNo} <span style={{ color: colors.textSecondary, fontWeight: 500 }}>· {a.stage}</span>
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: colors.textSecondary, mt: "1px" }} noWrap>
                    {formatTime(a.startTime)} – {formatTime(a.endTime)}
                    {a.durationMins != null ? ` · ${a.durationMins}m` : ""}
                  </Typography>
                </Box>
                <Chip
                  label={a.remark}
                  size="small"
                  sx={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: tone.color,
                    background: tone.light,
                    borderRadius: "6px",
                    border: `1px solid ${tone.border}`,
                    height: "auto",
                    flexShrink: 0,
                    "& .MuiChip-label": { px: "8px", py: "3px" },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
