import { Box, Skeleton, Tooltip, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { useTabColorTokens } from "../../../../../style/theme";
import type { CancelledCrqSummary } from "../../../types/cancelledCrq.types";
import { stageLabel } from "../cancelledCrqFormat";

interface StatProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: "danger" | "warning" | "info" | "accent" | "neutral";
  loading: boolean;
}

const Stat = ({ icon, label, value, hint, tone, loading }: StatProps) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const palette = {
    danger: { fg: tk.danger, bg: tk.dangerDim, br: tk.dangerBorder },
    warning: { fg: tk.warning, bg: tk.warningDim, br: tk.warningBorder },
    info: { fg: tk.info, bg: tk.infoDim, br: tk.infoBorder },
    accent: { fg: tk.accent, bg: tk.accentDim, br: tk.accentBorder },
    neutral: { fg: tk.textSecondary, bg: tk.surface2, br: tk.border },
  }[tone];

  return (
    <Box
      sx={{
        flex: "1 1 180px",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.75,
        py: 1.25,
        borderRadius: tk.radiusL,
        bgcolor: tk.surface,
        border: `1px solid ${tk.border}`,
        transition: "border-color .18s, box-shadow .18s",
        "&:hover": { borderColor: tk.borderHover, boxShadow: tk.shadowCard },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: tk.radius,
          display: "grid",
          placeItems: "center",
          color: palette.fg,
          bgcolor: palette.bg,
          border: `1px solid ${palette.br}`,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: tk.textSecondary,
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>

        {loading ? (
          <Skeleton width={72} height={22} />
        ) : (
          <Tooltip title={hint ?? value} placement="bottom-start">
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 700,
                color: tk.textPrimary,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {value}
            </Typography>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

interface Props {
  summary?: CancelledCrqSummary;
  loading: boolean;
}

/**
 * Headline counters above the register.
 *
 * These come from GET /crqworkflow/cancelled/summary rather than being
 * derived from the rows on screen: the table is server-paged, so a client
 * side count would only ever describe the current page and would silently
 * contradict the "Total cancelled" the user is reading it as.
 */
export const CancelledCrqStats = ({ summary, loading }: Props) => {
  const num = (v: number | null | undefined) => String(v ?? 0);

  const topStage = summary?.topStage ? stageLabel(summary.topStage) : "—";
  const topReason = summary?.topReason ?? "—";

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      <Stat
        loading={loading}
        tone="danger"
        icon={<BlockRoundedIcon sx={{ fontSize: 18 }} />}
        label="Total cancelled"
        value={num(summary?.totalCancelled)}
        hint="Cancelled CRQs matching the current filters, across every stage"
      />
      <Stat
        loading={loading}
        tone="warning"
        icon={<HistoryRoundedIcon sx={{ fontSize: 18 }} />}
        label="Last 30 days"
        value={num(summary?.cancelledLast30Days)}
      />
      <Stat
        loading={loading}
        tone="info"
        icon={<LayersRoundedIcon sx={{ fontSize: 18 }} />}
        label="This month"
        value={num(summary?.cancelledThisMonth)}
      />
      <Stat
        loading={loading}
        tone="accent"
        icon={<HubRoundedIcon sx={{ fontSize: 18 }} />}
        label="Domains affected"
        value={num(summary?.affectedDomains)}
      />
      <Stat
        loading={loading}
        tone="neutral"
        icon={<LayersRoundedIcon sx={{ fontSize: 18 }} />}
        label="Top stage"
        value={
          summary?.topStage
            ? `${topStage} (${summary.topStageCount ?? 0})`
            : "—"
        }
        hint={`Stage accounting for the most cancellations: ${topStage}`}
      />
      <Stat
        loading={loading}
        tone="neutral"
        icon={<ReportProblemRoundedIcon sx={{ fontSize: 18 }} />}
        label="Top reason"
        value={
          summary?.topReason
            ? `${topReason} (${summary.topReasonCount ?? 0})`
            : "—"
        }
        hint={`Most frequent cancellation reason: ${topReason}`}
      />
    </Box>
  );
};

export default CancelledCrqStats;
