import React, {
  memo,
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import {
  alpha,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Paper,
  Popper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import SelectAllOutlinedIcon from "@mui/icons-material/SelectAllOutlined";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";

// import {
//   buildDayColumns,
//   colDistribution,
//   shiftSummary,
// } from "../util/Futureweek.utils";
// import { MONO, SHIFT_COLORS, SHIFT_DISPLAY_ORDER } from "../util/Shiftconstants";
// import type { NormalisedEmployee, ShiftCode } from "../types/Futureweek.types";
import { ShiftChip } from "./Shiftchip";
import { useVirtualRows, VIRTUAL_ROW_HEIGHT } from "./Usevirtualrows";
import { ScrollSentinel, AllLoadedRow } from "./Scrollsentinel";
import { EmployeeCell } from "./EmployeeCell";
import type { NormalisedEmployee, ShiftCode } from "../../types/Futureweek.types";
import { MONO, SHIFT_COLORS, SHIFT_DISPLAY_ORDER } from "../../util/Shiftconstants";
import { buildDayColumns, colDistribution, shiftSummary } from "../../util/Futureweek.utils";

// ─── Layout constants ──────────────────────────────────────────────────────────

// Sticky name column shrinks on narrow viewports (mirrors the Golden Set
// grid's EMP_COL_W) — the 7 day-columns stay fixed-width and scroll
// horizontally instead, since unlike the name column they can't usefully
// reflow.
const EMP_COL_WIDTH  = { xs: 152, sm: 188, md: 216, lg: 232 };
const DAY_COL_WIDTH  = 62;
const STAT_COL_WIDTH = 54;
const TOTAL_DAY_COLS = 7;

// ─── Edit-mode type ───────────────────────────────────────────────────────────
// "drag" removed — replaced by shift-click range selection built into "select"
export type EditMode = "select" | "column" | "row";

// ─── Pending-change types ─────────────────────────────────────────────────────

/** Cell-level pending map.  Key = `"${futureId}:${dayIndex}"` */
export type CellKey = `${number}:${number}`;
export type PendingCellsMap = Record<CellKey, ShiftCode>;

/**
 * Row-level map exposed to the parent for the Save payload.
 * Only rows with ≥1 changed cell appear here.
 */
export type PendingChangesMap = Record<number, ShiftCode[]>;

function makeCellKey(futureId: number, dayIndex: number): CellKey {
  return `${futureId}:${dayIndex}`;
}

function buildRowMap(
  cells: PendingCellsMap,
  employees: NormalisedEmployee[],
): PendingChangesMap {
  const rowMap: PendingChangesMap = {};

  for (const key of Object.keys(cells) as CellKey[]) {
    const futureId = Number(key.split(":")[0]);
    if (!(futureId in rowMap)) {
      const emp = employees.find((e) => e.futureId === futureId);
      rowMap[futureId] = emp
        ? ([...emp.shifts] as ShiftCode[])
        : (Array(7).fill("G") as ShiftCode[]);
    }
  }

  for (const [key, code] of Object.entries(cells) as [CellKey, ShiftCode][]) {
    const [fidStr, dayStr] = key.split(":");
    rowMap[Number(fidStr)][Number(dayStr)] = code;
  }

  return rowMap;
}

// ─── Sx helpers ────────────────────────────────────────────────────────────────

function stickyHeaderCellSx(isDark: boolean) {
  const bg = isDark ? "#1E293B" : "#F8FAFC";
  return {
    position: "sticky" as const,
    top: 0,
    zIndex: 4,
    // Both the shorthand and the longhand must be forced: MUI's theme applies
    // a semi-transparent `backgroundColor` to every head-variant TableCell
    // (see MuiTableCell.styleOverrides.head in style/theme.ts) — without
    // `!important` on backgroundColor, that rule wins the cascade and lets
    // scrolling body rows show through the "sticky" header.
    background: `${bg} !important`,
    backgroundColor: `${bg} !important`,
    backgroundImage: "none",
    backdropFilter: "none",
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.10)"}`,
    whiteSpace: "nowrap" as const,
    padding: "8px 6px",
  };
}

function stickyEmpCellSx(isDark: boolean) {
  return {
    position: "sticky" as const,
    left: 0,
    zIndex: 2,
    bgcolor: isDark ? "#0F1825" : "#FAFCFF",
    backgroundImage: "none",
    borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"}`,
    py: 0.75,
    px: 1.5,
    width: EMP_COL_WIDTH,
    minWidth: EMP_COL_WIDTH,
    maxWidth: EMP_COL_WIDTH,
  };
}

function stickyEmpHeadCellSx(isDark: boolean) {
  const bg = isDark ? "#1E293B" : "#F8FAFC";
  return {
    position: "sticky" as const,
    left: 0,
    top: 0,
    zIndex: 6,
    background: `${bg} !important`,
    backgroundColor: `${bg} !important`,
    backgroundImage: "none",
    backdropFilter: "none",
    borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.10)"}`,
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.10)"}`,
    padding: "8px 12px",
    width: EMP_COL_WIDTH,
    minWidth: EMP_COL_WIDTH,
  };
}

function weekendBodyCellSx(isDark: boolean) {
  return {
    bgcolor: isDark ? "rgba(236,72,153,0.04)" : "rgba(236,72,153,0.025)",
  };
}

function weekendHeaderCellSx(isDark: boolean) {
  const bg = isDark ? "#1A1629" : "#F5F0FA";
  return {
    ...stickyHeaderCellSx(isDark),
    background: `${bg} !important`,
    backgroundColor: `${bg} !important`,
    backgroundImage: "none",
  };
}

function weekendStartBorderSx() {
  return { borderLeft: "2px solid rgba(236,72,153,0.25)" };
}

function statCellSx() {
  return {
    textAlign: "center" as const,
    px: 0.5,
    width: STAT_COL_WIDTH,
    minWidth: STAT_COL_WIDTH,
  };
}

function statFirstCellSx(isDark: boolean) {
  return {
    ...statCellSx(),
    borderLeft: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.08)"}`,
  };
}

// ─── ShiftPopover ──────────────────────────────────────────────────────────────

interface ShiftPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  selectionSize: number;
  onApply: (code: ShiftCode) => void;
  onClose: () => void;
}

function ShiftPopover({
  open,
  anchorEl,
  selectionSize,
  onApply,
  onClose,
}: ShiftPopoverProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [picked, setPicked] = useState<ShiftCode>("G");

  useEffect(() => {
    if (open) setPicked("G");
  }, [open]);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      modifiers={[{ name: "offset", options: { offset: [0, 6] } }]}
      style={{ zIndex: 1400 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(13,27,42,0.12)"}`,
            borderRadius: "12px",
            p: 1.5,
            minWidth: 248,
            bgcolor: isDark ? "#1E293B" : "#fff",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(13,27,42,0.12)",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 650,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(13,27,42,0.5)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            Apply shift — {selectionSize} cell{selectionSize !== 1 ? "s" : ""}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
            {SHIFT_DISPLAY_ORDER.map((code) => (
              <Box
                key={code}
                onClick={() => setPicked(code)}
                sx={{ cursor: "pointer" }}
              >
                <ShiftChip code={code} size="md" active={picked === code} />
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 1.25 }} />

          <Stack direction="row" gap={0.75}>
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={() => onApply(picked)}
              sx={{
                flex: 1,
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                fontWeight: 650,
                textTransform: "none",
              }}
            >
              Apply
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={onClose}
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                fontWeight: 600,
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(13,27,42,0.18)",
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(13,27,42,0.5)",
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

// ─── DayHeaderCell ─────────────────────────────────────────────────────────────

interface DayHeaderCellProps {
  dayIndex: number;
  shortLabel: string;
  isWeekend: boolean;
  isWeekendStart: boolean;
  isColumnSelected: boolean;
  editMode: EditMode;
  editing: boolean;
  distribution?: Partial<Record<ShiftCode, number>>;
  isDark: boolean;
  headerRef: (el: HTMLTableCellElement | null) => void;
  onClick: (dayIndex: number, shiftKey: boolean) => void;
}

const DayHeaderCell = memo(function DayHeaderCell({
  dayIndex,
  shortLabel,
  isWeekend,
  isWeekendStart,
  isColumnSelected,
  editMode,
  editing,
  distribution,
  isDark,
  headerRef,
  onClick,
}: DayHeaderCellProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const baseSx = isWeekend
    ? weekendHeaderCellSx(isDark)
    : stickyHeaderCellSx(isDark);
  const workingCodes: ShiftCode[] = ["A", "B", "G", "LG", "N", "H"];
  const isClickable = editing && editMode === "column";

  return (
    <TableCell
      ref={headerRef}
      align="center"
      onClick={
        isClickable
          ? (e: React.MouseEvent) => onClick(dayIndex, e.shiftKey)
          : undefined
      }
      sx={[
        baseSx,
        { width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH },
        isWeekendStart ? weekendStartBorderSx() : {},
        isClickable
          ? {
              cursor: "pointer",
              "&:hover": {
                bgcolor: isDark
                  ? "rgba(55,138,221,0.15)"
                  : "rgba(55,138,221,0.08)",
              },
            }
          : {},
        isColumnSelected
          ? {
              bgcolor: `${alpha(accent, isDark ? 0.22 : 0.12)} !important`,
              outline: `2px solid ${alpha(accent, 0.6)}`,
              outlineOffset: -2,
            }
          : {},
      ]}
    >
      <Stack alignItems="center" gap={0.3}>
        {isWeekend && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mb: 0.25 }}>
            <WbSunnyOutlinedIcon
              sx={{ fontSize: 9, color: isDark ? "#F9A8D4" : "#BE185D", opacity: 0.8 }}
            />
            <Typography
              sx={{
                fontSize: 8.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isDark ? "#F9A8D4" : "#BE185D",
                lineHeight: 1,
              }}
            >
              Wknd
            </Typography>
          </Box>
        )}
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: isColumnSelected ? 800 : isWeekend ? 700 : 650,
            lineHeight: 1,
            color: isColumnSelected
              ? accent
              : isWeekend
              ? isDark ? "#F9A8D4" : "#BE185D"
              : "text.secondary",
          }}
        >
          {shortLabel}
        </Typography>
        {editing && editMode === "column" && !isColumnSelected && (
          <Typography
            sx={{
              fontSize: 8,
              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(13,27,42,0.3)",
              mt: 0.2,
              lineHeight: 1,
            }}
          >
            click
          </Typography>
        )}
        {isColumnSelected && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: accent,
              mt: 0.3,
            }}
          />
        )}
        {distribution && (
          <Box
            sx={{
              display: "flex",
              height: 3,
              width: 40,
              borderRadius: 2,
              overflow: "hidden",
              mt: 0.4,
              bgcolor: "action.hover",
            }}
          >
            {workingCodes
              .filter((k) => (distribution[k] ?? 0) > 0)
              .map((k) => (
                <Box
                  key={k}
                  sx={{
                    flex: distribution[k],
                    height: "100%",
                    bgcolor: SHIFT_COLORS[k]?.solid,
                  }}
                />
              ))}
          </Box>
        )}
      </Stack>
    </TableCell>
  );
});

// ─── ShiftCell ─────────────────────────────────────────────────────────────────

interface ShiftCellProps {
  futureId: number;
  dayIndex: number;
  code: ShiftCode;
  employeeName: string;
  isDark: boolean;
  editing: boolean;
  editMode: EditMode;
  isSelected: boolean;
  isPending: boolean;
  isWeekend: boolean;
  isWeekendStart: boolean;
  accent: string;
  onClick: (futureId: number, dayIndex: number, shiftKey: boolean, el: HTMLElement) => void;
}

const ShiftCell = memo(
  function ShiftCell({
    futureId,
    dayIndex,
    code,
    employeeName,
    isDark,
    editing,
    editMode,
    isSelected,
    isPending,
    isWeekend,
    isWeekendStart,
    accent,
    onClick,
  }: ShiftCellProps) {
    const cellRef = useRef<HTMLButtonElement | null>(null);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!editing || editMode !== "select") return;
        e.preventDefault();
        onClick(futureId, dayIndex, e.shiftKey, cellRef.current!);
      },
      [editing, editMode, futureId, dayIndex, onClick],
    );

    return (
      <TableCell
        align="center"
        sx={[
          { padding: "4px 3px", width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH },
          isWeekend ? weekendBodyCellSx(isDark) : {},
          isWeekendStart ? weekendStartBorderSx() : {},
          isSelected && editing
            ? {
                bgcolor: `${alpha(accent, isDark ? 0.2 : 0.1)} !important`,
                outline: `2px solid ${alpha(accent, 0.55)}`,
                outlineOffset: -2,
              }
            : {},
        ]}
      >
        <Tooltip
          title={`${employeeName} · ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][dayIndex]} · ${code}`}
          arrow
          disableInteractive
          disableHoverListener={editing}
        >
          <Box
            component="button"
            ref={cellRef}
            onClick={handleClick}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              border: "none",
              background: "none",
              cursor: editing && editMode === "select" ? "pointer" : "default",
              borderRadius: "6px",
              transition: "box-shadow 0.1s, transform 0.08s",
              userSelect: "none",
              position: "relative",
              ...(isPending && {
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 1,
                  right: 1,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: accent,
                  boxShadow: `0 0 4px ${alpha(accent, 0.8)}`,
                  pointerEvents: "none",
                },
              }),
              ...(editing &&
                editMode === "select" && {
                  "&:hover": {
                    boxShadow: `0 0 0 2.5px ${alpha(accent, 0.5)}`,
                    transform: "scale(1.08)",
                    zIndex: 1,
                  },
                  "&:active": { transform: "scale(0.96)" },
                }),
            }}
          >
            <ShiftChip code={code} size="md" active={isSelected && editing} />
          </Box>
        </Tooltip>
      </TableCell>
    );
  },
  (prev, next) =>
    prev.code       === next.code &&
    prev.isSelected === next.isSelected &&
    prev.isPending  === next.isPending &&
    prev.isDark     === next.isDark &&
    prev.editing    === next.editing &&
    prev.editMode   === next.editMode &&
    prev.accent     === next.accent,
);

// ─── EmpRow ────────────────────────────────────────────────────────────────────

interface EmpRowProps {
  employee: NormalisedEmployee;
  isDark: boolean;
  editing: boolean;
  editMode: EditMode;
  localShifts: ShiftCode[];
  isDirtyRow: boolean;
  pendingDays: Set<number>;
  selectedCells: Set<CellKey>;
  isRowSelected: boolean;
  accent: string;
  rowHeaderRef: (el: HTMLTableCellElement | null) => void;
  onCellClick: (futureId: number, dayIndex: number, shiftKey: boolean, el: HTMLElement) => void;
  onRowHeaderClick: (futureId: number, el: HTMLTableCellElement | null, shiftKey: boolean) => void;
}

const EmpRow = memo(
  function EmpRow({
    employee,
    isDark,
    editing,
    editMode,
    localShifts,
    isDirtyRow,
    pendingDays,
    selectedCells,
    isRowSelected,
    accent,
    rowHeaderRef,
    onCellClick,
    onRowHeaderClick,
  }: EmpRowProps) {
    const theme = useTheme();
    const summary = useMemo(() => shiftSummary(localShifts), [localShifts]);
    const loadPct = Math.round((summary.work / TOTAL_DAY_COLS) * 100);
    const isHighNight = summary.night > 2;
    const isLowRest = summary.off >= 3;

    const localRowHeaderRef = useRef<HTMLTableCellElement | null>(null);

    const setRowHeaderRef = useCallback(
      (el: HTMLTableCellElement | null) => {
        localRowHeaderRef.current = el;
        rowHeaderRef(el);
      },
      [rowHeaderRef],
    );

    const handleRowHeaderClick = useCallback(
      (e: React.MouseEvent) => {
        if (!editing || editMode !== "row") return;
        onRowHeaderClick(employee.futureId, localRowHeaderRef.current, e.shiftKey);
      },
      [editing, editMode, employee.futureId, onRowHeaderClick],
    );

    return (
      <TableRow
        sx={{
          height: VIRTUAL_ROW_HEIGHT,
          "&:last-child td": { borderBottom: 0 },
          "&:hover td": {
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(13,27,42,0.015)",
          },
          ...(editing && {
            "&:hover td.sticky-emp-cell": {
              bgcolor: `${isDark ? "#0F1825" : "#FAFCFF"} !important`,
            },
          }),
          ...(isDirtyRow && {
            "& td:first-of-type": {
              boxShadow: `inset 3px 0 0 ${alpha(accent, 0.7)}`,
            },
          }),
        }}
      >
        {/* Sticky employee column */}
        <TableCell
          className="sticky-emp-cell"
          ref={setRowHeaderRef}
          onClick={handleRowHeaderClick}
          sx={[
            stickyEmpCellSx(isDark),
            editing && editMode === "row"
              ? {
                  cursor: "pointer",
                  transition: "background 0.15s",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(55,138,221,0.08)"
                      : "rgba(55,138,221,0.10)",
                  },
                }
              : {},
            isRowSelected
              ? {
                  bgcolor: isDark
                    ? "rgba(55,138,221,0.12)"
                    : "rgba(55,138,221,0.07)",
                  boxShadow: `inset 3px 0 0 ${alpha(accent, 0.7)}`,
                }
              : {},
          ]}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <EmployeeCell employee={employee} accent={isRowSelected} />
            <Stack direction="row" gap={0.4} sx={{ ml: 1, flexShrink: 0 }}>
              {isDirtyRow && (
                <Tooltip title="Unsaved changes" arrow>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: accent,
                      boxShadow: `0 0 5px ${alpha(accent, 0.6)}`,
                      animation: "tkPulse 2s infinite",
                    }}
                  />
                </Tooltip>
              )}
              {isHighNight && (
                <Tooltip title="High night load (>2 nights)" arrow>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "warning.main",
                      boxShadow: "0 0 5px rgba(245,158,11,0.55)",
                    }}
                  />
                </Tooltip>
              )}
              {isLowRest && (
                <Tooltip title="Low rest (≥3 days off)" arrow>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      boxShadow: "0 0 5px rgba(239,68,68,0.55)",
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </TableCell>

        {/* Day shift cells */}
        {localShifts.map((code, dayIndex) => (
          <ShiftCell
            key={dayIndex}
            futureId={employee.futureId}
            dayIndex={dayIndex}
            code={code}
            employeeName={employee.employeeName}
            isDark={isDark}
            editing={editing}
            editMode={editMode}
            isSelected={selectedCells.has(makeCellKey(employee.futureId, dayIndex))}
            isPending={pendingDays.has(dayIndex)}
            isWeekend={dayIndex === 5 || dayIndex === 6}
            isWeekendStart={dayIndex === 5}
            accent={accent}
            onClick={onCellClick}
          />
        ))}

        {/* Work stat */}
        <TableCell sx={statFirstCellSx(isDark)}>
          <Stack alignItems="center" gap={0.25}>
            <Typography
              sx={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: "text.primary" }}
            >
              {summary.work}
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 2,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${loadPct}%`,
                  height: "100%",
                  borderRadius: 1,
                  bgcolor:
                    loadPct >= 85
                      ? "error.main"
                      : loadPct >= 65
                      ? "warning.main"
                      : "primary.main",
                }}
              />
            </Box>
          </Stack>
        </TableCell>

        {/* Night stat */}
        <TableCell
          sx={[
            statCellSx(),
            isHighNight ? { color: SHIFT_COLORS.N?.fgLight, fontWeight: 700 } : {},
          ]}
        >
          <Typography
            sx={{ fontSize: 11, fontWeight: isHighNight ? 700 : 500, fontFamily: MONO }}
          >
            {summary.night}
          </Typography>
        </TableCell>

        {/* Off stat */}
        <TableCell
          sx={[
            statCellSx(),
            isLowRest ? { color: SHIFT_COLORS.OFF?.fgLight, fontWeight: 700 } : {},
          ]}
        >
          <Typography
            sx={{ fontSize: 11, fontWeight: isLowRest ? 700 : 500, fontFamily: MONO }}
          >
            {summary.off}
          </Typography>
        </TableCell>
      </TableRow>
    );
  },
  (prev, next) =>
    prev.employee      === next.employee &&
    prev.isDark        === next.isDark &&
    prev.editing       === next.editing &&
    prev.editMode      === next.editMode &&
    prev.localShifts   === next.localShifts &&
    prev.isDirtyRow    === next.isDirtyRow &&
    prev.pendingDays   === next.pendingDays &&
    prev.selectedCells === next.selectedCells &&
    prev.isRowSelected === next.isRowSelected &&
    prev.accent        === next.accent,
);

// ─── SkeletonRow ───────────────────────────────────────────────────────────────

function SkeletonRow({ isDark }: { isDark: boolean }) {
  return (
    <TableRow sx={{ height: VIRTUAL_ROW_HEIGHT }}>
      <TableCell sx={stickyEmpCellSx(isDark)}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "9px", flexShrink: 0 }} />
          <Stack gap={0.5}>
            <Skeleton variant="text" width={120} height={14} />
            <Skeleton variant="text" width={80} height={10} />
          </Stack>
        </Stack>
      </TableCell>
      {Array.from({ length: TOTAL_DAY_COLS }).map((_, i) => (
        <TableCell key={i} align="center" sx={{ padding: "4px 3px" }}>
          <Skeleton variant="rounded" width={40} height={28} sx={{ mx: "auto", borderRadius: "6px" }} />
        </TableCell>
      ))}
      {["W", "N", "OFF"].map((s) => (
        <TableCell key={s} sx={statCellSx()}>
          <Skeleton variant="text" width={22} height={14} sx={{ mx: "auto" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── FooterDayCell ─────────────────────────────────────────────────────────────

const FooterDayCell = memo(function FooterDayCell({
  count,
  totalEmps,
  isWeekend,
  isWeekendStart,
  isDark,
}: {
  count: number;
  totalEmps: number;
  isWeekend: boolean;
  isWeekendStart: boolean;
  isDark: boolean;
}) {
  const bg = isDark ? "#141E2D" : "#F1F5FA";
  return (
    <TableCell
      align="center"
      sx={[
        {
          position: "sticky" as const,
          bottom: 0,
          zIndex: 2,
          bgcolor: bg,
          backgroundImage: "none",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"}`,
          padding: "6px 3px",
          width: DAY_COL_WIDTH,
          minWidth: DAY_COL_WIDTH,
        },
        isWeekend ? { bgcolor: isDark ? "#1A1629" : "#F5F0FA", backgroundImage: "none" } : {},
        isWeekendStart ? weekendStartBorderSx() : {},
      ]}
    >
      <Stack alignItems="center" gap={0}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: "text.primary" }}>
          {count}
        </Typography>
        <Typography sx={{ fontSize: 8.5, color: "text.disabled" }}>
          /{totalEmps}
        </Typography>
      </Stack>
    </TableCell>
  );
});

// ─── EditModeBar ───────────────────────────────────────────────────────────────

interface EditModeBarProps {
  editMode: EditMode;
  onChange: (mode: EditMode) => void;
}

export function EditModeBar({ editMode, onChange }: EditModeBarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const MODES: {
    value: EditMode;
    icon: React.ReactNode;
    label: string;
    tip: string;
  }[] = [
    {
      value: "select",
      icon: <SelectAllOutlinedIcon sx={{ fontSize: 14 }} />,
      label: "Select",
      tip: "Click a cell to select it and apply the active shift immediately. Shift+click extends a rectangle selection.",
    },
    {
      value: "column",
      icon: <ViewColumnOutlinedIcon sx={{ fontSize: 14 }} />,
      label: "Column",
      tip: "Click a day header to select that column. Shift+click adds more columns. Pick a shift in the popup.",
    },
    {
      value: "row",
      icon: <ViewWeekOutlinedIcon sx={{ fontSize: 14 }} />,
      label: "Row",
      tip: "Click an employee name to select their entire week. Shift+click adds more rows. Pick a shift in the popup.",
    },
  ];

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={editMode}
      onChange={(_, val) => val && onChange(val as EditMode)}
      sx={{
        "& .MuiToggleButton-root": {
          fontSize: 11,
          fontWeight: 600,
          height: 28,
          px: 1.25,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(13,27,42,0.12)"}`,
          textTransform: "none",
          gap: 0.5,
          color: isDark ? "rgba(255,255,255,0.55)" : "rgba(13,27,42,0.55)",
          "&.Mui-selected": {
            bgcolor: isDark ? "rgba(55,138,221,0.2)" : "rgba(55,138,221,0.1)",
            color: theme.palette.primary.main,
            borderColor: alpha(theme.palette.primary.main, 0.4),
          },
        },
      }}
    >
      {MODES.map((m) => (
        <Tooltip key={m.value} title={m.tip} arrow placement="top">
          <ToggleButton value={m.value}>
            {m.icon}
            {m.label}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}

// ─── FutureWeekGrid ────────────────────────────────────────────────────────────

interface FutureWeekGridProps {
  employees: NormalisedEmployee[];
  isLoading: boolean;
  totalEmployees: number;
  isoYear: number;
  isoWeek: number;
  brush: ShiftCode;
  editing: boolean;
  editMode: EditMode;
  onPendingChanges?: (changes: PendingChangesMap) => void;
  clearPendingRef?: React.MutableRefObject<(() => void) | null>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loadedCount?: number;
  totalCount?: number;
}

export function FutureWeekGrid({
  employees,
  isLoading,
  totalEmployees,
  isoYear,
  isoWeek,
  editing,
  editMode,
  brush,
  onPendingChanges,
  clearPendingRef,
  onLoadMore,
  hasMore,
  isFetchingMore,
  loadedCount,
  totalCount,
}: FutureWeekGridProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = theme.palette.primary.main;

  // Suppress unused-variable warning — isoYear/isoWeek are passed from parent
  void isoYear;
  void isoWeek;

  // ── Day columns (no args — labels are always Mon–Sun) ─────────────────────
  const dayCols = useMemo(() => buildDayColumns(), []);

  // ── Committed cell-level overrides ────────────────────────────────────────
  const [pendingCells, setPendingCells] = useState<PendingCellsMap>({});
  const pendingCellsRef = useRef<PendingCellsMap>({});

  if (clearPendingRef) {
    clearPendingRef.current = () => {
      pendingCellsRef.current = {};
      setPendingCells({});
      onPendingChanges?.({});
    };
  }

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [selectedColIndices, setSelectedColIndices] = useState<Set<number>>(new Set());
  const [selectedRowFutureIds, setSelectedRowFutureIds] = useState<Set<number>>(new Set());

  // Anchor for the popover (the element that was last clicked)
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // Track the last clicked cell/row for Shift+click range extension
  const lastCellRef = useRef<{ futureId: number; dayIndex: number } | null>(null);
  const lastColRef  = useRef<number>(-1);
  const lastRowRef  = useRef<number>(-1); // index in employees[]

  // Header refs for popover anchor
  const colHeaderRefs = useRef<(HTMLTableCellElement | null)[]>([]);
  const rowHeaderRefs = useRef<Map<number, HTMLTableCellElement | null>>(new Map());

  // ── Virtualisation ────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const { visibleRows, paddingTop, paddingBottom } = useVirtualRows(employees, containerRef);

  // ── Keyboard: ESC clears selection ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setSelectedColIndices(new Set());
    setSelectedRowFutureIds(new Set());
    setPopoverAnchor(null);
    lastCellRef.current = null;
    lastColRef.current = -1;
    lastRowRef.current = -1;
  }, []);

  useEffect(() => {
    clearSelection();
  }, [editing, editMode, clearSelection]);

  const getLocalShifts = useCallback(
    (emp: NormalisedEmployee): ShiftCode[] => {
      const overrides = pendingCellsRef.current;
      return emp.shifts.map((s, d) => {
        const k = makeCellKey(emp.futureId, d);
        return overrides[k] ?? (s as ShiftCode);
      });
    },
    [],
  );

  const commitCells = useCallback(
    (cells: Set<CellKey>, code: ShiftCode) => {
      if (cells.size === 0) return;
      const next: PendingCellsMap = { ...pendingCellsRef.current };
      cells.forEach((k) => { next[k] = code; });
      pendingCellsRef.current = next;
      setPendingCells(next);
      onPendingChanges?.(buildRowMap(next, employees));
    },
    [employees, onPendingChanges],
  );

  // ─── Build a rectangle of CellKeys between two cells ─────────────────────

  const buildRectFromCells = useCallback(
    (
      startFid: number, startDay: number,
      endFid: number,   endDay: number,
    ): Set<CellKey> => {
      const si = employees.findIndex((e) => e.futureId === startFid);
      const ei = employees.findIndex((e) => e.futureId === endFid);
      const minE = Math.min(si, ei);
      const maxE = Math.max(si, ei);
      const minD = Math.min(startDay, endDay);
      const maxD = Math.max(startDay, endDay);
      const cells = new Set<CellKey>();
      for (let r = minE; r <= maxE; r++) {
        for (let d = minD; d <= maxD; d++) {
          cells.add(makeCellKey(employees[r].futureId, d));
        }
      }
      return cells;
    },
    [employees],
  );

  // ─── Build column range ───────────────────────────────────────────────────

  const buildColRange = useCallback(
    (startDay: number, endDay: number): Set<CellKey> => {
      const minD = Math.min(startDay, endDay);
      const maxD = Math.max(startDay, endDay);
      const cells = new Set<CellKey>();
      for (const emp of employees) {
        for (let d = minD; d <= maxD; d++) {
          cells.add(makeCellKey(emp.futureId, d));
        }
      }
      return cells;
    },
    [employees],
  );

  // ─── Build row range ──────────────────────────────────────────────────────

  const buildRowRange = useCallback(
    (startIdx: number, endIdx: number): Set<CellKey> => {
      const minI = Math.min(startIdx, endIdx);
      const maxI = Math.max(startIdx, endIdx);
      const cells = new Set<CellKey>();
      for (let i = minI; i <= maxI; i++) {
        const emp = employees[i];
        if (!emp) continue;
        for (let d = 0; d < TOTAL_DAY_COLS; d++) {
          cells.add(makeCellKey(emp.futureId, d));
        }
      }
      return cells;
    },
    [employees],
  );

  // ─── Cell click (select mode) ─────────────────────────────────────────────

  const handleCellClick = useCallback(
    (futureId: number, dayIndex: number, shiftKey: boolean, el: HTMLElement) => {
      if (shiftKey && lastCellRef.current) {
        // Shift+click → extend rectangle from last anchor
        const cells = buildRectFromCells(
          lastCellRef.current.futureId, lastCellRef.current.dayIndex,
          futureId, dayIndex,
        );
        setSelectedCells(cells);
        setPopoverAnchor(el);
      } else {
        // Single click → select just this cell and apply brush immediately
        const key = makeCellKey(futureId, dayIndex);
        commitCells(new Set([key]), brush);
        setSelectedCells(new Set());
        setPopoverAnchor(null);
        lastCellRef.current = { futureId, dayIndex };
      }
    },
    [brush, commitCells, buildRectFromCells],
  );

  // ─── Column header click ──────────────────────────────────────────────────

  const handleColumnHeaderClick = useCallback(
    (dayIndex: number, shiftKey: boolean) => {
      if (!editing || editMode !== "column") return;

      if (shiftKey && lastColRef.current >= 0) {
        // Shift+click → select range of columns
        const minD = Math.min(lastColRef.current, dayIndex);
        const maxD = Math.max(lastColRef.current, dayIndex);
        const newCols = new Set<number>();
        for (let d = minD; d <= maxD; d++) newCols.add(d);
        setSelectedColIndices(newCols);
        const cells = buildColRange(lastColRef.current, dayIndex);
        setSelectedCells(cells);
        setPopoverAnchor(colHeaderRefs.current[dayIndex] ?? null);
      } else {
        // Single click — toggle
        if (selectedColIndices.has(dayIndex) && selectedColIndices.size === 1) {
          clearSelection();
          return;
        }
        const newCols = new Set([dayIndex]);
        setSelectedColIndices(newCols);
        const cells = buildColRange(dayIndex, dayIndex);
        setSelectedCells(cells);
        lastColRef.current = dayIndex;
        setPopoverAnchor(colHeaderRefs.current[dayIndex] ?? null);
      }
    },
    [editing, editMode, selectedColIndices, buildColRange, clearSelection],
  );

  // ─── Row header click ─────────────────────────────────────────────────────

  const handleRowHeaderClick = useCallback(
    (futureId: number, el: HTMLTableCellElement | null, shiftKey: boolean) => {
      if (!editing || editMode !== "row") return;
      const empIdx = employees.findIndex((e) => e.futureId === futureId);
      if (empIdx < 0) return;

      if (shiftKey && lastRowRef.current >= 0) {
        // Shift+click → extend row range
        const minI = Math.min(lastRowRef.current, empIdx);
        const maxI = Math.max(lastRowRef.current, empIdx);
        const newRows = new Set<number>();
        for (let i = minI; i <= maxI; i++) {
          if (employees[i]) newRows.add(employees[i].futureId);
        }
        setSelectedRowFutureIds(newRows);
        const cells = buildRowRange(lastRowRef.current, empIdx);
        setSelectedCells(cells);
        setPopoverAnchor(el);
      } else {
        // Single click → toggle
        if (selectedRowFutureIds.has(futureId) && selectedRowFutureIds.size === 1) {
          clearSelection();
          return;
        }
        const cells = buildRowRange(empIdx, empIdx);
        setSelectedCells(cells);
        setSelectedRowFutureIds(new Set([futureId]));
        lastRowRef.current = empIdx;
        setPopoverAnchor(el);
      }
    },
    [editing, editMode, employees, selectedRowFutureIds, buildRowRange, clearSelection],
  );

  // ─── Popover apply ────────────────────────────────────────────────────────

  const handlePopoverApply = useCallback(
    (code: ShiftCode) => {
      commitCells(selectedCells, code);
      clearSelection();
    },
    [selectedCells, commitCells, clearSelection],
  );

  // ─── Per-day distributions ────────────────────────────────────────────────
  const dayDistributions = useMemo<Partial<Record<ShiftCode, number>>[]>(
    () =>
      Array.from({ length: TOTAL_DAY_COLS }, (_, d) =>
        colDistribution(employees, d, pendingCells),
      ),
    [employees, pendingCells],
  );

  // ─── Footer staffed counts ────────────────────────────────────────────────
  // FIX: was checking for "W", "H", "Leave" — should exclude WO and OFF only.
  const footerCounts = useMemo<number[]>(
    () =>
      Array.from({ length: TOTAL_DAY_COLS }, (_, d) =>
        employees.filter((e) => {
          const k = makeCellKey(e.futureId, d);
          const code = pendingCells[k] ?? (e.shifts[d] as ShiftCode);
          return code !== "WO" && code !== "OFF";
        }).length,
      ),
    [employees, pendingCells],
  );

  // ─── Row-level dirty / pending sets ──────────────────────────────────────
  const dirtyFutureIds = useMemo(
    () => new Set(Object.keys(pendingCells).map((k) => Number(k.split(":")[0]))),
    [pendingCells],
  );

  const pendingDaysByEmp = useCallback(
    (futureId: number): Set<number> => {
      const days = new Set<number>();
      for (const k of Object.keys(pendingCells) as CellKey[]) {
        const [fidStr, dayStr] = k.split(":");
        if (Number(fidStr) === futureId) days.add(Number(dayStr));
      }
      return days;
    },
    [pendingCells],
  );

  const totalHeight = employees.length * VIRTUAL_ROW_HEIGHT;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
        "@keyframes tkPulse": {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
      }}
    >
      <TableContainer
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          // Floors the scroll area so it never collapses to near-nothing on
          // short viewports (landscape phones, a keyboard eating vertical
          // space) — the static 300px chrome estimate can outgrow 100vh
          // there.
          maxHeight: "max(280px, calc(100vh - 300px))",
          overflow: "auto",
          position: "relative",
          "&::-webkit-scrollbar": { width: 6, height: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            borderRadius: 6,
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
            },
          },
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{
            tableLayout: "fixed",
            "& .MuiTableCell-stickyHeader": { backgroundImage: "none" },
          }}
        >
          {/* ── TableHead ─────────────────────────────────────────────────── */}
          <TableHead>
            <TableRow>
              <TableCell sx={stickyEmpHeadCellSx(isDark)}>
                <Typography sx={{ fontSize: 11, fontWeight: 650, color: "text.secondary" }}>
                  Employee
                </Typography>
              </TableCell>

              {dayCols.map((col, i) => (
                <DayHeaderCell
                  key={i}
                  dayIndex={i}
                  shortLabel={col.shortLabel}
                  isWeekend={col.isWeekend}
                  isWeekendStart={col.isWeekendStart}
                  isColumnSelected={selectedColIndices.has(i)}
                  editMode={editMode}
                  editing={editing}
                  distribution={dayDistributions[i]}
                  isDark={isDark}
                  headerRef={(el) => { colHeaderRefs.current[i] = el; }}
                  onClick={handleColumnHeaderClick}
                />
              ))}

              {(["W", "N", "Off"] as const).map((label, i) => (
                <TableCell
                  key={label}
                  align="center"
                  sx={[
                    stickyHeaderCellSx(isDark),
                    { width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH },
                    i === 0
                      ? {
                          borderLeft: `2px solid ${
                            isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.08)"
                          }`,
                        }
                      : {},
                  ]}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 650, color: "text.secondary" }}>
                    {label}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* ── TableBody ─────────────────────────────────────────────────── */}
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} isDark={isDark} />
              ))}

            {!isLoading && paddingTop > 0 && (
              <TableRow>
                <TableCell
                  colSpan={TOTAL_DAY_COLS + 4}
                  sx={{ height: paddingTop, p: 0, border: 0 }}
                />
              </TableRow>
            )}

            {!isLoading &&
              visibleRows.map((emp) => {
                const localShifts = getLocalShifts(emp);
                return (
                  <EmpRow
                    key={emp.futureId}
                    employee={emp}
                    isDark={isDark}
                    editing={editing}
                    editMode={editMode}
                    localShifts={localShifts}
                    isDirtyRow={dirtyFutureIds.has(emp.futureId)}
                    pendingDays={pendingDaysByEmp(emp.futureId)}
                    selectedCells={selectedCells}
                    isRowSelected={selectedRowFutureIds.has(emp.futureId)}
                    accent={accent}
                    rowHeaderRef={(el) => { rowHeaderRefs.current.set(emp.futureId, el); }}
                    onCellClick={handleCellClick}
                    onRowHeaderClick={handleRowHeaderClick}
                  />
                );
              })}

            {/* Virtual bottom spacer */}
            {!isLoading && paddingBottom > 0 && (
              <TableRow>
                <TableCell
                  colSpan={TOTAL_DAY_COLS + 4}
                  sx={{ height: paddingBottom, p: 0, border: 0 }}
                />
              </TableRow>
            )}

            {!isLoading && employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={TOTAL_DAY_COLS + 4}
                  sx={{ textAlign: "center", py: 6, color: "text.secondary" }}
                >
                  No employees to display
                </TableCell>
              </TableRow>
            )}

            {/* Infinite-scroll sentinel / all-loaded indicator */}
            <TableRow>
              <TableCell colSpan={TOTAL_DAY_COLS + 4} sx={{ p: 0, border: 0 }}>
                {hasMore ? (
                  <ScrollSentinel
                    onVisible={onLoadMore ?? (() => {})}
                    rootRef={containerRef}
                    disabled={isFetchingMore}
                    loadedCount={loadedCount}
                    totalCount={totalCount ?? null}
                  />
                ) : (
                  !isLoading &&
                  employees.length > 0 && (
                    <AllLoadedRow
                      loadedCount={loadedCount ?? employees.length}
                      totalCount={totalCount ?? null}
                    />
                  )
                )}
              </TableCell>
            </TableRow>
          </TableBody>

          {/* ── TableFooter ───────────────────────────────────────────────── */}
          <TableFooter>
            <TableRow>
              <TableCell
                sx={{
                  position: "sticky",
                  bottom: 0,
                  left: 0,
                  zIndex: 5,
                  bgcolor: isDark ? "#141E2D" : "#F1F5FA",
                  backgroundImage: "none",
                  borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"}`,
                  borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"}`,
                  px: 1.5,
                  py: 0.75,
                  width: EMP_COL_WIDTH,
                  minWidth: EMP_COL_WIDTH,
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>
                  Staffed / day
                </Typography>
              </TableCell>

              {footerCounts.map((count, i) => (
                <FooterDayCell
                  key={i}
                  count={count}
                  totalEmps={totalEmployees}
                  isWeekend={i === 5 || i === 6}
                  isWeekendStart={i === 5}
                  isDark={isDark}
                />
              ))}

              {[0, 1, 2].map((i) => (
                <TableCell
                  key={i}
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: 2,
                    bgcolor: isDark ? "#141E2D" : "#F1F5FA",
                    backgroundImage: "none",
                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"}`,
                  }}
                />
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* ShiftPopover — shown for column, row, and multi-cell select modes */}
      <ShiftPopover
        open={popoverAnchor !== null && selectedCells.size > 0}
        anchorEl={popoverAnchor}
        selectionSize={selectedCells.size}
        onApply={handlePopoverApply}
        onClose={clearSelection}
      />
    </Box>
  );
}