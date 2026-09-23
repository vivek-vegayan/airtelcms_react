import { Box, Card, LinearProgress, Typography } from "@mui/material";
import type { Colors } from "../../../dashboard/types/colorTypes";
import { getCardSx } from "../../../dashboard/constants/dashboard.styles";
import { SectionHeader } from "../../../dashboard/components/SectionHeader";
import { StageChip, STAGE_COLOR } from "../shared/Chips";
import type { StageBar } from "../../types/types";

interface PipelineStagesCardProps {
  stageBars: StageBar[];
  colors: Colors;
  mounted: boolean;
  delay: number;
}

export function PipelineStagesCard({ stageBars, colors, mounted, delay }: PipelineStagesCardProps) {
  const total = stageBars.reduce((sum, b) => sum + b.count, 0);
  const cardSx = getCardSx(colors);

  return (
    <Card
      sx={{
        ...cardSx,
        p: "18px 20px",
        height: "100%",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(12px)",
        transition: `${cardSx.transition}, opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
      }}
    >
      <SectionHeader
        title="Change Pipeline — by Stage"
        subtitle="Live distribution of active CRQs across the approval workflow"
        colors={colors}
        right={
          <Box sx={{
            fontSize: 11, fontWeight: 700, color: colors.textSecondary,
            bgcolor: colors.surface2, border: `1px solid ${colors.border}`,
            borderRadius: "20px", px: "10px", py: "3px",
          }}>
            {total} total
          </Box>
        }
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", mt: "6px" }}>
        {stageBars.map((b) => {
          const stageColor = STAGE_COLOR[b.stage]?.fg ?? colors.accent;
          return (
            <Box
              key={b.stage}
              sx={{
                borderRadius: "10px",
                p: "8px 10px",
                transition: "background-color .18s",
                "&:hover": { bgcolor: colors.surface2 },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "6px" }}>
                <StageChip stage={b.stage} />
                <Box sx={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, fontFamily: "'Roboto Mono', monospace" }}>
                    {b.count}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: colors.textSecondary, fontFamily: "'Roboto Mono', monospace" }}>
                    · {b.pct}%
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={b.pct}
                sx={{
                  height: 7,
                  borderRadius: 4,
                  bgcolor: colors.isDark ? "rgba(255,255,255,0.06)" : "rgba(13,27,42,0.06)",
                  "& .MuiLinearProgress-bar": { borderRadius: 4, backgroundColor: stageColor },
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
