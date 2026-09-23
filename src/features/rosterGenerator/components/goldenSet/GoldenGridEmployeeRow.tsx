import { memo } from "react";
import { alpha, Box, Checkbox, Stack, TableCell, TableRow, Tooltip } from "@mui/material";
import { CELL_H, EMP_COL_W, MONO, Z_INDEX } from "./goldenGrid.constants";
import type { EditMode, GoldenGridTokens, GoldenSetEmployee } from "./goldenGrid.types";
import { getShiftColor, summarise } from "./goldenGrid.utils";
import EmployeeCell from "./EmployeeCell";
import GoldenGridShiftCell from "./GoldenGridShiftCell";

interface GoldenGridEmployeeRowProps {
  emp: GoldenSetEmployee;
  shifts: string[];
  hasLocalChanges: boolean;
  isSelected: boolean;
  editing: boolean;
  editMode: EditMode;
  tk: GoldenGridTokens;
  paperBg: string;
  warningColor: string;
  errorColor: string;
  onRowCheck: (prefId: number, checked: boolean, shiftKey: boolean) => void;
  onCellMouseDown: (prefId: number, colIdx: number) => void;
  onCellMouseEnter: (prefId: number, colIdx: number) => void;
}

function GoldenGridEmployeeRow({
  emp,
  shifts,
  hasLocalChanges,
  isSelected,
  editing,
  editMode,
  tk,
  paperBg,
  warningColor,
  errorColor,
  onRowCheck,
  onCellMouseDown,
  onCellMouseEnter,
}: GoldenGridEmployeeRowProps) {
  const s = summarise(shifts);
  const isHighLoad = s.night > 8;
  const isLowRest = s.off < 6;
  const nightColor = getShiftColor("N").color;
  const offColor = getShiftColor("W").color;

  return (
    <TableRow
      sx={{
        height: CELL_H + 8,
        transition: "background 0.1s",
        bgcolor: isSelected
          ? alpha(tk.accent, 0.05)
          : hasLocalChanges && editing
            ? alpha(warningColor, 0.03)
            : undefined,
        "&:hover td": {
          bgcolor: tk.isDark ? "rgba(255,255,255,0.025)" : "rgba(13,27,42,0.025)",
        },
      }}
    >
      {/* Checkbox cell */}
      <TableCell
        sx={{
          width: editing ? 40 : 0,
          minWidth: editing ? 40 : 0,
          p: editing ? "0 4px" : 0,
          textAlign: "center",
          overflow: "hidden",
          transition: "width .2s, min-width .2s",
          borderRight:
            editing && editMode === "select" ? `0.5px solid ${tk.border}` : "none",
        }}
      >
        {editing && editMode === "select" && (
          <Checkbox
            size="small"
            checked={isSelected}
            onChange={(e) =>
              onRowCheck(
                emp.prefId,
                e.target.checked,
                (e.nativeEvent as MouseEvent).shiftKey,
              )
            }
            sx={{ p: 0.5 }}
          />
        )}
      </TableCell>

      {/* Sticky employee cell */}
      <TableCell
        sx={{
          position: "sticky",
          left: editing ? 40 : 0,
          zIndex: Z_INDEX.STICKY_COLUMN,
          width: EMP_COL_W,
          minWidth: EMP_COL_W,
          maxWidth: EMP_COL_W,
          boxShadow: tk.isDark
            ? "3px 0 8px -2px rgba(0,0,0,0.5)"
            : "3px 0 8px -2px rgba(13,27,42,0.1)",
          borderRight: `1.5px solid ${tk.border} !important`,
          py: "4px",
          px: "14px",
          backgroundColor: isSelected
            ? `${alpha(tk.accent, 0.07)} !important`
            : `${paperBg} !important`,
          borderLeft: isSelected ? `2.5px solid ${tk.accent}` : undefined,
          willChange: "transform",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <EmployeeCell emp={emp} isEditing={editing} />
          {(isHighLoad || isLowRest) && (
            <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
              {isHighLoad && (
                <Tooltip title="High night load (>8 nights)" arrow>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "warning.main",
                      boxShadow: `0 0 6px ${alpha(warningColor, 0.5)}`,
                    }}
                  />
                </Tooltip>
              )}
              {isLowRest && (
                <Tooltip title="Low rest (<6 days off)" arrow>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      boxShadow: `0 0 6px ${alpha(errorColor, 0.5)}`,
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>
      </TableCell>

      {/* Shift cells */}
      {shifts.map((code, i) => (
        <GoldenGridShiftCell
          key={i}
          code={code}
          columnIndex={i}
          employeeId={emp.prefId}
          employeeName={emp.name}
          isChanged={hasLocalChanges && shifts[i] !== emp.shifts[i]}
          isRowSelected={isSelected}
          editing={editing}
          editMode={editMode}
          tk={tk}
          warningColor={warningColor}
          onCellMouseDown={onCellMouseDown}
          onCellMouseEnter={onCellMouseEnter}
        />
      ))}

      {/* Summary cells */}
      <TableCell
        sx={{
          fontFamily: MONO,
          fontWeight: 600,
          textAlign: "center",
          fontSize: 11,
          bgcolor: tk.isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.008)",
          color: tk.textSecondary,
          px: "8px",
          borderLeft: `2.5px solid ${alpha(tk.textPrimary, 0.12)}`,
        }}
      >
        {s.work}
      </TableCell>
      <TableCell
        sx={{
          fontFamily: MONO,
          textAlign: "center",
          fontSize: 11,
          bgcolor: tk.isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.008)",
          px: "8px",
          color: isHighLoad ? nightColor : tk.textSecondary,
          fontWeight: isHighLoad ? 700 : 600,
        }}
      >
        {s.night}
      </TableCell>
      <TableCell
        sx={{
          fontFamily: MONO,
          textAlign: "center",
          fontSize: 11,
          bgcolor: tk.isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.008)",
          px: "8px",
          color: isLowRest ? offColor : tk.textSecondary,
          fontWeight: isLowRest ? 700 : 600,
        }}
      >
        {s.off}
      </TableCell>
    </TableRow>
  );
}

export default memo(GoldenGridEmployeeRow);
