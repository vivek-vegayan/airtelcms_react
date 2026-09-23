import { memo } from "react";
import { alpha, Box, TableCell, Tooltip } from "@mui/material";
import { CELL_H, CELL_W, DOW_LONG, MONO, SHIFT_META } from "./goldenGrid.constants";
import type { EditMode, GoldenGridTokens } from "./goldenGrid.types";
import { getShiftColor } from "./goldenGrid.utils";

interface GoldenGridShiftCellProps {
  code: string;
  columnIndex: number;
  employeeId: number;
  employeeName: string;
  isChanged: boolean;
  isRowSelected: boolean;
  editing: boolean;
  editMode: EditMode;
  tk: GoldenGridTokens;
  warningColor: string;
  onCellMouseDown: (prefId: number, colIdx: number) => void;
  onCellMouseEnter: (prefId: number, colIdx: number) => void;
}

function GoldenGridShiftCell({
  code,
  columnIndex,
  employeeId,
  employeeName,
  isChanged,
  isRowSelected,
  editing,
  editMode,
  tk,
  warningColor,
  onCellMouseDown,
  onCellMouseEnter,
}: GoldenGridShiftCellProps) {
  const sc = getShiftColor(code);
  const d = columnIndex % 7;
  const w = Math.floor(columnIndex / 7);

  return (
    <TableCell
      sx={{
        width: CELL_W + 6,
        minWidth: CELL_W + 6,
        p: "2px 3px",
        textAlign: "center",
        verticalAlign: "middle",
        borderLeft:
          d === 0 && w > 0
            ? `2.5px solid ${alpha(tk.textPrimary, 0.12)}`
            : undefined,
        bgcolor:
          d >= 5
            ? tk.isDark
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.015)"
            : undefined,
      }}
    >
      <Tooltip
        title={`${employeeName} · W${w + 1} ${DOW_LONG[d]} · ${SHIFT_META[code]?.label ?? code}`}
        arrow
        disableInteractive
      >
        <Box
          component="button"
          sx={{
            display: "inline-grid",
            placeItems: "center",
            width: CELL_W,
            height: CELL_H,
            lineHeight: 1,
            border: "1.5px solid",
            borderRadius: "6px",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 10.5,
            cursor: editing && editMode === "drag" ? "crosshair" : "default",
            padding: 0,
            userSelect: "none",
            transition: "box-shadow 0.12s, border-color 0.12s, filter 0.12s",
            bgcolor: sc.background,
            color: sc.color,
            borderColor: sc.border,
            ...(isChanged && {
              boxShadow: `0 0 0 2px ${alpha(warningColor, 0.5)}`,
              borderColor: `${warningColor} !important`,
            }),
            ...(editing &&
              editMode === "select" &&
              isRowSelected && {
                outline: `1.5px dashed ${alpha(tk.accent, 0.4)}`,
                outlineOffset: -1,
              }),
            ...(editing &&
              editMode === "drag" && {
                "&:hover": {
                  boxShadow: `0 0 0 2.5px ${tk.accent}, 0 2px 12px ${tk.accentDim}`,
                  borderColor: `${tk.accent} !important`,
                  filter: "brightness(0.92) saturate(1.2)",
                },
              }),
          }}
          onMouseDown={() => {
            if (!editing || editMode !== "drag") return;
            onCellMouseDown(employeeId, columnIndex);
          }}
          onMouseEnter={() => {
            if (!editing || editMode !== "drag") return;
            onCellMouseEnter(employeeId, columnIndex);
          }}
        >
          {code}
        </Box>
      </Tooltip>
    </TableCell>
  );
}

export default memo(GoldenGridShiftCell);
