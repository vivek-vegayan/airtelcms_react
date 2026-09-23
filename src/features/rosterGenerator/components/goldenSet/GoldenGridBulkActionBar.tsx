import type { ChangeEvent } from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { MONO, SHIFT_CODES, SHIFT_META } from "./goldenGrid.constants";
import { getShiftColor } from "./goldenGrid.utils";
import { useGoldenGridTokens } from "./useGoldenGridTokens";

interface GoldenGridBulkActionBarProps {
  selectedCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  bulkWeek: number | "all";
  setBulkWeek: (v: number | "all") => void;
  bulkDay: number | "all";
  setBulkDay: (v: number | "all") => void;
  onApplyShift: (code: string) => void;
}

export default function GoldenGridBulkActionBar({
  selectedCount,
  filteredCount,
  onSelectAll,
  onClear,
  bulkWeek,
  setBulkWeek,
  bulkDay,
  setBulkDay,
  onApplyShift,
}: GoldenGridBulkActionBarProps) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        px: 2,
        py: 1.25,
        flexShrink: 0,
        border: `1.5px solid ${tk.accentBorder}`,
        borderRadius: tk.radiusL,
        bgcolor: tk.accentDim,
        animation: "fadeSlideIn .18s ease",
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: tk.accent,
          }}
        />
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: tk.accent }}>
          {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
        </Typography>
      </Stack>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: tk.accentBorder }}
      />

      <Button
        size="small"
        variant="text"
        sx={{
          fontSize: 11,
          height: 26,
          color: tk.accent,
          fontWeight: 600,
          minWidth: 0,
          px: 1,
        }}
        onClick={onSelectAll}
      >
        Select all ({filteredCount})
      </Button>
      <Button
        size="small"
        variant="text"
        sx={{
          fontSize: 11,
          height: 26,
          color: tk.textSecondary,
          fontWeight: 600,
          minWidth: 0,
          px: 1,
        }}
        onClick={onClear}
      >
        Clear
      </Button>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: tk.accentBorder }}
      />

      <Typography sx={{ fontSize: 11, color: tk.textSecondary, fontWeight: 500 }}>
        Apply to:
      </Typography>

      <Box
        component="select"
        value={String(bulkWeek)}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setBulkWeek(e.target.value === "all" ? "all" : parseInt(e.target.value))
        }
        sx={{
          fontSize: 11,
          px: 1,
          py: 0.5,
          borderRadius: "6px",
          border: `1px solid ${tk.border}`,
          bgcolor: tk.surface,
          color: tk.textPrimary,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="all">All weeks</option>
        {Array.from({ length: 6 }, (_, i) => (
          <option key={i} value={i}>
            Week {i + 1}
          </option>
        ))}
      </Box>

      <Box
        component="select"
        value={String(bulkDay)}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setBulkDay(e.target.value === "all" ? "all" : parseInt(e.target.value))
        }
        sx={{
          fontSize: 11,
          px: 1,
          py: 0.5,
          borderRadius: "6px",
          border: `1px solid ${tk.border}`,
          bgcolor: tk.surface,
          color: tk.textPrimary,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="all">All days</option>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <option key={i} value={i}>
            {d}
          </option>
        ))}
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: tk.accentBorder }}
      />

      <Typography sx={{ fontSize: 11, color: tk.textSecondary, fontWeight: 500 }}>
        Set shift:
      </Typography>

      <Stack direction="row" gap={0.5} flexWrap="wrap">
        {SHIFT_CODES.map((code) => {
          const sc = getShiftColor(code);
          return (
            <Tooltip
              key={code}
              title={`Apply "${code}" — ${SHIFT_META[code]?.label}`}
              arrow
            >
              <Box
                component="button"
                onClick={() => onApplyShift(code)}
                sx={{
                  display: "inline-grid",
                  placeItems: "center",
                  minWidth: code === "Leave" ? 48 : 34,
                  height: 28,
                  px: 0.75,
                  borderRadius: "6px",
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  border: `1.5px solid ${sc.border}`,
                  bgcolor: sc.background,
                  color: sc.color,
                  cursor: "pointer",
                  transition: "all .12s",
                  "&:hover": {
                    filter: "brightness(.9)",
                    transform: "scale(1.08)",
                  },
                  "&:active": { transform: "scale(.97)" },
                }}
              >
                {code}
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}
