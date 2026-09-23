import { Box, Card, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import type { Colors } from "../../../dashboard/types/colorTypes";
import { AnimatedNumber } from "../../../dashboard/components/AnimatedNumber";
import type { DashboardKpi } from "../../types/types";

/** Tone lookup keyed by the KPI's own `accent` field — icon + color triple per accent. */
const ACCENT_STYLES = (colors: Colors) => ({
  blue:   { icon: PendingActionsRoundedIcon, color: colors.info,    light: colors.infoDim,    border: colors.infoBorder },
  green:  { icon: TaskAltRoundedIcon,        color: colors.success, light: colors.successDim, border: colors.successBorder },
  red:    { icon: WarningAmberRoundedIcon,   color: colors.danger,  light: colors.dangerDim,  border: colors.dangerBorder },
  orange: { icon: CancelRoundedIcon,         color: colors.warning, light: colors.warningDim, border: colors.warningBorder },
  purple: {
    icon: AutoAwesomeRoundedIcon,
    color: "#7C3AED",
    light: alpha("#7C3AED", colors.isDark ? 0.16 : 0.08),
    border: alpha("#7C3AED", colors.isDark ? 0.35 : 0.22),
  },
});

const VALID_ACCENTS = ["blue", "green", "orange", "red", "purple"] as const;
type Accent = (typeof VALID_ACCENTS)[number];

/**
 * The live sp_get_cab_dashboard_kpis proc only selects label/value/foot — no `accent` column —
 * so kpi.accent is always null in production and every card would otherwise fall back to the
 * same tone. Resolve by label as a stand-in until the proc is updated to send accent itself.
 */
const LABEL_ACCENT_FALLBACK: Record<string, Accent> = {
  "pending approvals": "blue",
  "awaiting your action": "blue",
  "approved today": "green",
  "approved this week": "green",
  "escalations": "red",
  "rejected": "orange",
  "rejected this week": "orange",
};

function resolveAccent(kpi: DashboardKpi): Accent {
  if (kpi.accent && (VALID_ACCENTS as readonly string[]).includes(kpi.accent)) {
    return kpi.accent;
  }
  return LABEL_ACCENT_FALLBACK[kpi.label.trim().toLowerCase()] ?? "blue";
}

interface CabKpiCardProps {
  kpi: DashboardKpi;
  colors: Colors;
  mounted: boolean;
  delay: number;
}

export function CabKpiCard({ kpi, colors, mounted, delay }: CabKpiCardProps) {
  const tone = ACCENT_STYLES(colors)[resolveAccent(kpi)];
  const Icon = tone.icon;
  // Backend sends `value` as a plain string (e.g. "12") — animate only when it's purely numeric.
  const isNumeric = /^-?\d+$/.test(String(kpi.value).trim());
  const numericValue = Number(kpi.value);

  return (
    <Card
      sx={{
        borderRadius: "14px",
        border: `1.5px solid ${colors.border}`,
        boxShadow: colors.isDark ? "0 2px 12px rgba(0,0,0,.35)" : "0 2px 12px rgba(60,60,140,.055)",
        overflow: "hidden",
        position: "relative",
        cursor: "default",
        background: `linear-gradient(155deg, ${tone.light} 0%, ${colors.surface} 55%)`,
        height: "100%",
        transition: "box-shadow .22s, border-color .22s, transform .22s, opacity .45s ease, transform .45s ease",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(12px)",
        transitionDelay: `${delay}s`,
        "&:hover": {
          boxShadow: colors.isDark ? "0 8px 26px rgba(0,0,0,.5)" : "0 8px 28px rgba(60,60,140,.11)",
          borderColor: tone.border,
          transform: "translateY(-3px)",
          "& .kpi-icon": { transform: "scale(1.08) rotate(-4deg)" },
          "& .kpi-bar": { opacity: 1 },
        },
      }}
    >
      <Box
        className="kpi-bar"
        sx={{
          position: "absolute", top: 10, bottom: 10, left: 0, width: "3px",
          borderRadius: "0 3px 3px 0", opacity: 0, transition: "opacity .25s",
          background: tone.color,
        }}
      />

      <Box sx={{ p: "16px 18px 14px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "14px" }}>
          <Box
            className="kpi-icon"
            sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: tone.light, border: `1px solid ${tone.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: tone.color, flexShrink: 0, transition: "transform .25s",
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              flex: 1, minWidth: 0, fontSize: 10.5, fontWeight: 700,
              color: colors.textSecondary, letterSpacing: ".5px", textTransform: "uppercase",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {kpi.label}
          </Typography>
        </Box>

        <Typography sx={{ fontSize: 29, fontWeight: 900, color: colors.textPrimary, lineHeight: 1, letterSpacing: "-1px" }}>
          {isNumeric ? <AnimatedNumber value={numericValue} /> : kpi.value}
        </Typography>
        <Typography
          sx={{
            fontSize: 11.5, color: tone.color, fontWeight: 600, mt: "5px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {kpi.foot}
        </Typography>
      </Box>
    </Card>
  );
}
