import { Box, Card, Chip, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import type { Colors } from "../types/colorTypes";
import type { StatCardConfig } from "../types/dashboard.types";
import { getHoverShadow, getToneStyles } from "../constants/dashboard.styles";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "./Sparkline";

const ICONS = {
  trending: TrendingUpIcon,
  clock: AccessTimeIcon,
  calendar: CalendarTodayIcon,
  event: EventAvailableIcon,
} as const;

interface StatCardProps {
  config: StatCardConfig;
  colors: Colors;
}

export function StatCard({ config, colors }: StatCardProps) {
  const tones = getToneStyles(colors);
  const tone = tones[config.tone];
  const deltaTone = config.delta ? tones[config.delta.tone] : null;
  const Icon = ICONS[config.icon];

  return (
    <Card
      sx={{
        borderRadius: "14px",
        border: `1.5px solid ${colors.border}`,
        boxShadow: colors.isDark ? "0 2px 12px rgba(0,0,0,.35)" : "0 2px 12px rgba(60,60,140,.055)",
        overflow: "hidden",
        position: "relative",
        cursor: "default",
        background: `linear-gradient(155deg, ${tone.light} 0%, ${colors.surface} 52%)`,
        height: "100%",
        minHeight: { xs: 104, sm: 116 },
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow .22s, border-color .22s, transform .22s",
        "&:hover": {
          boxShadow: getHoverShadow(colors),
          borderColor: tone.border,
          transform: "translateY(-3px)",
          "& .sc-icon": { transform: "scale(1.08) rotate(-4deg)" },
          "& .sc-bar": { opacity: 1 },
        },
      }}
    >
      {/* tone stripe pinned to the left edge, revealed on hover */}
      <Box
        className="sc-bar"
        sx={{
          position: "absolute",
          top: 10,
          bottom: 10,
          left: 0,
          width: "3px",
          borderRadius: "0 3px 3px 0",
          opacity: 0,
          transition: "opacity .25s",
          background: tone.color,
        }}
      />

      <Box
        sx={{
          p: { xs: "11px 12px 10px", sm: "14px 16px 12px" },
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "7px", sm: "9px" }, mb: { xs: "8px", sm: "12px" } }}>
          <Box
            className="sc-icon"
            sx={{
              width: { xs: 28, sm: 34 },
              height: { xs: 28, sm: 34 },
              borderRadius: "10px",
              background: tone.light,
              border: `1px solid ${tone.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tone.color,
              flexShrink: 0,
              transition: "transform .25s",
            }}
          >
            <Icon sx={{ fontSize: { xs: 15, sm: 17 } }} />
          </Box>
          <Typography
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: 10,
              fontWeight: 700,
              color: colors.textSecondary,
              letterSpacing: ".5px",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {config.label}
          </Typography>
          {config.delta && deltaTone && (
            <Chip
              label={config.delta.text}
              size="small"
              sx={{
                fontSize: 9,
                fontWeight: 800,
                color: deltaTone.color,
                background: deltaTone.light,
                border: `1px solid ${deltaTone.border}`,
                borderRadius: "20px",
                height: "auto",
                flexShrink: 0,
                "& .MuiChip-label": { px: "7px", py: "2px" },
              }}
            />
          )}
        </Box>

        {/* Sits directly under the header rather than pinned to the tile
            floor: when a busy assignments list stretches this row, a bottom
            pin opened a band of dead space above every value. The labels are
            single-line by construction, so the four values still share a
            baseline. */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: 21, sm: 24, lg: 27 },
              fontWeight: 900,
              color: colors.textPrimary,
              lineHeight: 1.05,
              letterSpacing: "-1px",
              // A long value ("42 days") wraps rather than overflowing the tile.
              overflowWrap: "anywhere",
            }}
          >
            {typeof config.display === "number" ? <AnimatedNumber value={config.display} /> : config.display}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 10, sm: 11 },
              color: tone.color,
              fontWeight: 600,
              mt: "4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {config.sub}
          </Typography>
        </Box>

        {config.trend && (
          <Box sx={{ mt: "auto", pt: "10px", mx: "-4px" }}>
            <Sparkline data={config.trend} color={tone.color} height={26} />
          </Box>
        )}
      </Box>
    </Card>
  );
}
