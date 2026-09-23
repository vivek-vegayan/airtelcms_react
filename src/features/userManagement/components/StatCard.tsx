import { Box, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { useCountUp } from "../utils/userHelpers";

export interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  /** Categorical accent for this metric — used for the icon tile and the
   *  share bar, never for the figure itself (that stays text.primary so the
   *  numbers read as one column of data rather than six coloured badges). */
  color: string;
  /** Fraction of the directory this metric covers, 0–1. Omitted on the tile
   *  that *is* the total, which has nothing to be a share of. */
  share?: number;
  /** Plain-language reading of the figure, shown under the bar. */
  caption?: string;
  /** Short-viewport variant: tighter box, smaller figure, no share bar. */
  dense?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
  share,
  caption,
  dense = false,
}: StatCardProps) {
  const animated = useCountUp(value);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const pct = share === undefined ? null : Math.round(share * 100);

  return (
    <Tooltip title={caption ?? label} enterDelay={600}>
      <Box
        sx={{
          // Only the dense (scrolling) strip is a flex line; the standard
          // layout is a grid, where the track sets the width.
          ...(dense ? { flex: "1 1 128px", minWidth: 128 } : { minWidth: 0 }),
          p: dense ? 1 : 1.35,
          borderRadius: "12px",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor: alpha(color, isDark ? 0.5 : 0.35),
            boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.35)" : "0 4px 14px rgba(15,23,42,0.06)",
          },
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              width: dense ? 24 : 27,
              height: dense ? 24 : 27,
              borderRadius: "8px",
              bgcolor: alpha(color, isDark ? 0.22 : 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color, fontSize: dense ? 14 : 15 }} />
          </Box>
          <Typography
            sx={{
              fontSize: dense ? 10 : 10.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "text.secondary",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </Typography>
        </Stack>

        <Typography
          sx={{
            mt: dense ? 0.4 : 0.75,
            fontSize: dense ? 19 : 23,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "text.primary",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {animated.toLocaleString()}
        </Typography>

        {!dense && (
          <Box sx={{ mt: 0.75, minHeight: 22 }}>
            {pct !== null && (
              <Box
                sx={{
                  height: 3,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08),
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(100, Math.max(pct, value > 0 ? 2 : 0))}%`,
                    height: "100%",
                    borderRadius: 999,
                    bgcolor: color,
                    transition: "width 0.5s ease",
                  }}
                />
              </Box>
            )}
            {caption && (
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 10.5,
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {caption}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
