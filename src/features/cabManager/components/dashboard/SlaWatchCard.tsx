import { useMemo } from "react";
import { Box, Card, Chip, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import type { Colors } from "../../../dashboard/types/colorTypes";
import { getCardSx } from "../../../dashboard/constants/dashboard.styles";
import { SectionHeader } from "../../../dashboard/components/SectionHeader";
import { RadialProgress } from "../../../dashboard/components/RadialProgress";
import type { EscalationItem } from "../../types/types";

/** Same thresholds SlaBar (shared/Chips.tsx) uses, so "Critical" here always means the same thing it does elsewhere in CAB Manager. */
function severityOf(sla: number): { label: string; tone: "danger" | "warning" | "success" } {
  if (sla >= 80) return { label: "Critical", tone: "danger" };
  if (sla >= 50) return { label: "Warning", tone: "warning" };
  return { label: "Healthy", tone: "success" };
}

interface SlaWatchCardProps {
  escalations: EscalationItem[];
  colors: Colors;
  mounted: boolean;
  delay: number;
}

export function SlaWatchCard({ escalations, colors, mounted, delay }: SlaWatchCardProps) {
  const navigate = useNavigate();
  const cardSx = getCardSx(colors);
  const toneColor = { danger: colors.danger, warning: colors.warning, success: colors.success } as const;
  const toneBg = { danger: colors.dangerDim, warning: colors.warningDim, success: colors.successDim } as const;
  const toneBorder = { danger: colors.dangerBorder, warning: colors.warningBorder, success: colors.successBorder } as const;

  // Worst-first: highest SLA % (closest to/past breach) surfaces at the top of the list.
  const sorted = useMemo(
    () => [...escalations].sort((a, b) => b.slaPercentage - a.slaPercentage),
    [escalations]
  );

  return (
    <Card
      sx={{
        ...cardSx,
        p: "18px 20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(12px)",
        transition: `${cardSx.transition}, opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
      }}
    >
      <SectionHeader
        title="CAB SLA Watch"
        subtitle="Change requests nearing or past their approval SLA"
        colors={colors}
        right={
          sorted.length > 0 ? (
            <Chip
              icon={<WarningAmberRoundedIcon sx={{ fontSize: 14 }} />}
              label={`${sorted.length} breach${sorted.length > 1 ? "es" : ""}`}
              size="small"
              sx={{
                bgcolor: colors.dangerDim, color: colors.danger, border: `1px solid ${colors.dangerBorder}`,
                fontWeight: 700, "& .MuiChip-icon": { color: colors.danger },
              }}
            />
          ) : undefined
        }
      />

      {sorted.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, py: 3 }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 34, color: colors.success }} />
          <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, fontWeight: 500 }}>
            No SLA breaches right now.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {sorted.map((e) => {
            const severity = severityOf(e.slaPercentage);
            return (
              <Box
                key={e.crqNo}
                onClick={() => navigate(`/cabmanager/journey/${e.crqNo}`)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  py: "10px", cursor: "pointer", borderBottom: `1px solid ${colors.border}`,
                  borderRadius: "8px", px: "6px",
                  transition: "background-color .15s",
                  "&:hover": { bgcolor: colors.surface2 },
                  "&:last-of-type": { borderBottom: "none" },
                }}
              >
                <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RadialProgress
                    value={e.slaPercentage}
                    max={100}
                    size={44}
                    stroke={4}
                    color={toneColor[severity.tone]}
                    trackColor={colors.surface2}
                  />
                  <Typography sx={{ position: "absolute", fontSize: 10, fontWeight: 800, color: colors.textPrimary }}>
                    {e.slaPercentage}%
                  </Typography>
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12.5, color: colors.accent, fontWeight: 600 }}>
                    {e.crqNo}
                  </Typography>
                </Box>

                <Chip
                  label={severity.label}
                  size="small"
                  sx={{
                    bgcolor: toneBg[severity.tone], color: toneColor[severity.tone],
                    border: `1px solid ${toneBorder[severity.tone]}`, fontWeight: 700, flexShrink: 0,
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
