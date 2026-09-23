import { memo } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SHIFT_COLOR_MAP } from "../constant/shiftPalette";

interface Props {
  /** Shift keys to render; defaults to every key in the palette. */
  visibleCodes?: string[];
  /** Currently highlighted shift key (only used when interactive). */
  highlightShift?: string;
  /** When provided, legend chips toggle the highlight on click. */
  onToggleHighlight?: (key: string) => void;
}

/**
 * Shift legend shared by the Weekly and Monthly roster views. Rendered
 * below the table; interactive (click to highlight) when the view passes
 * `onToggleHighlight`.
 */
export const ShiftLegend = memo(
  ({ visibleCodes, highlightShift = "", onToggleHighlight }: Props) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";
    const codes = visibleCodes ?? Object.keys(SHIFT_COLOR_MAP);
    const interactive = Boolean(onToggleHighlight);

    return (
      <Box
        sx={{
          borderRadius: "0 0 10px 10px",
          bgcolor: isDark ? theme.palette.background.paper : "#F9FAFB",
          border: `1px solid ${CELL_BORDER}`,
          borderTop: "none",
          px: "14px",
          py: "10px",
        }}
      >
        <Typography
          fontSize={9}
          fontWeight={600}
          color="text.disabled"
          sx={{
            textTransform: "uppercase",
            letterSpacing: ".08em",
            // mb: "8px",
          }}
        >
          {/* {interactive ? "Shift legend · click to highlight" : "Shift legend"} */}
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap="5px">
          {codes.map((k) => {
            const p = SHIFT_COLOR_MAP[k];
            if (!p) return null;
            const isWO = k === "W";
            const isHL = interactive && highlightShift === k;
            return (
              <Stack
                key={k}
                direction="row"
                alignItems="center"
                gap="4px"
                onClick={
                  onToggleHighlight ? () => onToggleHighlight(k) : undefined
                }
                sx={{
                  bgcolor: isDark ? alpha(p.badgeBg, 0.08) : "#fff",
                  border: `1px solid ${
                    isHL
                      ? p.badgeBg
                      : isDark
                        ? alpha(p.badgeBg, 0.25)
                        : p.cardBorder
                  }`,
                  borderRadius: "6px",
                  px: "8px",
                  py: "4px",
                  cursor: interactive ? "pointer" : "default",
                  transition:
                    "box-shadow .12s, transform .12s, border-color .12s",
                  "&:hover": {
                    boxShadow: `0 2px 8px ${p.badgeBg}30`,
                    transform: "translateY(-1px)",
                  },
                  ...(isHL && { boxShadow: `0 0 0 2px ${p.badgeBg}44` }),
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "2px",
                    bgcolor: isWO ? "transparent" : p.badgeBg,
                    border: isWO
                      ? `1.5px dashed ${p.badgeBg}`
                      : "none",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  fontSize={10}
                  fontWeight={800}
                  sx={{ color: p.badgeBg }}
                >
                  {k}
                </Typography>
                <Box
                  sx={{
                    width: "1px",
                    height: 10,
                    bgcolor: isDark ? "rgba(255,255,255,.1)" : "#E5E7EB",
                  }}
                />
                <Typography
                  fontSize={9.5}
                  fontWeight={500}
                  color="text.secondary"
                  noWrap
                >
                  {p.label}
                </Typography>
                {!isWO && p.time !== "—" && (
                  <>
                    <Box
                      sx={{
                        width: "1px",
                        height: 10,
                        bgcolor: isDark ? "rgba(255,255,255,.1)" : "#E5E7EB",
                      }}
                    />
                    <Typography fontSize={8.5} color="text.disabled" noWrap>
                      {p.time}
                    </Typography>
                  </>
                )}
              </Stack>
            );
          })}
        </Stack>
      </Box>
    );
  },
);
ShiftLegend.displayName = "ShiftLegend";
