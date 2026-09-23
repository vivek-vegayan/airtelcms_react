import { Box, Divider, Popover, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { MONO, SHIFT_CODES, SHIFT_META } from "./goldenGrid.constants";
import { getShiftColor } from "./goldenGrid.utils";
import { useGoldenGridTokens } from "./useGoldenGridTokens";

interface WeekPopoverState {
  anchorEl: HTMLElement;
  weekIdx: number;
}

interface GoldenGridWeekOverridePopoverProps {
  weekPopover: WeekPopoverState | null;
  onClose: () => void;
  selectedCount: number;
  visibleCount: number;
  onApply: (code: string, weekIdx: number) => void;
}

export default function GoldenGridWeekOverridePopover({
  weekPopover,
  onClose,
  selectedCount,
  visibleCount,
  onApply,
}: GoldenGridWeekOverridePopoverProps) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);

  return (
    <Popover
      open={!!weekPopover}
      anchorEl={weekPopover?.anchorEl ?? null}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      PaperProps={{
        sx: {
          borderRadius: tk.radiusL,
          border: `1px solid ${tk.border}`,
          p: 2,
          boxShadow: tk.isDark
            ? "0 8px 32px rgba(0,0,0,.5)"
            : "0 8px 32px rgba(13,27,42,.15)",
          minWidth: 280,
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: tk.textSecondary,
          mb: 0.5,
          letterSpacing: ".05em",
          textTransform: "uppercase",
        }}
      >
        Override Week {weekPopover ? weekPopover.weekIdx + 1 : ""}
      </Typography>
      <Typography sx={{ fontSize: 11, color: tk.textDim, mb: 1.5 }}>
        {selectedCount > 0
          ? `Applies to ${selectedCount} selected row${selectedCount !== 1 ? "s" : ""}`
          : `Applies to all ${visibleCount} visible rows`}
      </Typography>
      <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 1 }}>
        {SHIFT_CODES.map((code) => {
          const sc = getShiftColor(code);
          return (
            <Tooltip key={code} title={SHIFT_META[code]?.label} arrow>
              <Box
                component="button"
                onClick={() => onApply(code, weekPopover!.weekIdx)}
                sx={{
                  display: "inline-grid",
                  placeItems: "center",
                  minWidth: code === "Leave" ? 50 : 38,
                  height: 32,
                  px: 1,
                  borderRadius: "7px",
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1.5px solid ${sc.border}`,
                  bgcolor: sc.background,
                  color: sc.color,
                  cursor: "pointer",
                  transition: "all .12s",
                  "&:hover": {
                    filter: "brightness(.9)",
                    transform: "scale(1.1)",
                  },
                  "&:active": { transform: "scale(.96)" },
                }}
              >
                {code}
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Typography sx={{ fontSize: 10, color: tk.textDim }}>
        This will overwrite all 7 days of Week{" "}
        {weekPopover ? weekPopover.weekIdx + 1 : ""} with the chosen shift
      </Typography>
    </Popover>
  );
}
