import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  alpha,
  Box,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import {
  CELL_W,
  DOW_SHORT,
  EMP_COL_W,
  MONO,
  TOTAL_COLS,
  WEEK_ROW_H,
  Z_INDEX,
} from "./goldenGrid.constants";
import type { EditMode, GoldenSetEmployee } from "./goldenGrid.types";
import { workingCount } from "./goldenGrid.utils";
import { useGoldenGridTokens } from "./useGoldenGridTokens";
import ShiftLegend from "./ShiftLegend";
import BrushBar from "./BrushBar";
import GoldenGridEmployeeRow from "./GoldenGridEmployeeRow";

// Breathing room left below the card, and the floor it won't shrink past.
const GRID_BOTTOM_GAP = 16;
const MIN_GRID_HEIGHT = 320;

interface GoldenGridTableProps {
  allEmpsCount: number;
  filtered: GoldenSetEmployee[];
  dayTotals: Record<string, number>[];
  getShifts: (emp: GoldenSetEmployee) => string[];
  localGrid: Record<number, string[]>;
  selectedRows: Set<number>;
  editing: boolean;
  editMode: EditMode;
  brush: string;
  setBrush: (c: string) => void;
  changedCount: number;
  isLoading: boolean;
  onRowCheck: (prefId: number, checked: boolean, shiftKey: boolean) => void;
  onCellMouseDown: (prefId: number, colIdx: number) => void;
  onCellMouseEnter: (prefId: number, colIdx: number) => void;
  onWeekHeaderContextMenu: (anchorEl: HTMLElement, weekIdx: number) => void;
  selectAllRows: () => void;
  clearSelection: () => void;
}

export default function GoldenGridTable({
  allEmpsCount,
  filtered,
  dayTotals,
  getShifts,
  localGrid,
  selectedRows,
  editing,
  editMode,
  brush,
  setBrush,
  changedCount,
  isLoading,
  onRowCheck,
  onCellMouseDown,
  onCellMouseEnter,
  onWeekHeaderContextMenu,
  selectAllRows,
  clearSelection,
}: GoldenGridTableProps) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);
  const paperBg = theme.palette.background.paper;
  const warningColor = theme.palette.warning.main;
  const errorColor = theme.palette.error.main;

  // Measure the week-header row's real rendered height so the day-header row
  // (the second sticky row) always lines up beneath it, regardless of font
  // metrics/zoom/theme — WEEK_ROW_H is only the pre-measurement fallback.
  const weekRowRef = useRef<HTMLTableRowElement>(null);
  const [dayRowTop, setDayRowTop] = useState<number>(WEEK_ROW_H);

  useEffect(() => {
    const el = weekRowRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setDayRowTop(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Measure the sticky footer's real rendered height so the body can reserve
  // exactly that much scroll runway at its end — otherwise, since the footer
  // is `position:sticky`, it renders in front of whatever body row is
  // scrolling past that bottom slice instead of letting the last row clear
  // it first.
  const footerRowRef = useRef<HTMLTableRowElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const el = footerRowRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setFooterHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cap the card's height at the real remaining viewport space below it,
  // measured directly — the app shell above this screen doesn't currently
  // give it a definite height to flex against, so `flex:1` alone can't
  // constrain it. Re-measures after every render (cheap: one rAF + one
  // DOMRect read) so it stays correct as banners above the table
  // appear/disappear, plus on window resize.
  const cardRef = useRef<HTMLDivElement>(null);
  const [maxCardHeight, setMaxCardHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const recompute = () => {
      const top = el.getBoundingClientRect().top;
      const available = window.innerHeight - top - GRID_BOTTOM_GAP;
      setMaxCardHeight(Math.max(available, MIN_GRID_HEIGHT));
    };

    const raf = requestAnimationFrame(recompute);
    window.addEventListener("resize", recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recompute);
    };
  });

  const empColBg = tk.isDark ? "rgba(30,30,46,1)" : "rgba(248,250,252,1)";
  const weekHeaderBg = tk.isDark ? "rgba(24,95,165,0.13)" : "rgba(24,95,165,0.07)";
  const dayHeaderBg = tk.isDark ? "rgba(15,110,86,0.10)" : "rgba(15,110,86,0.05)";

  const baseHeadSx = {
    whiteSpace: "nowrap" as const,
    boxSizing: "border-box" as const,
    py: "6px",
    px: "4px",
    fontWeight: 650,
    color: tk.textSecondary,
    textAlign: "center" as const,
    fontSize: 11,
    // Promotes sticky cells to their own GPU compositing layer so the
    // browser doesn't have to repaint them inline against scrolling body
    // rows — without this, fast scrolling can show a brief flash/ghost of
    // whatever's scrolling underneath before the layer catches up.
    willChange: "transform" as const,
  };

  const weekHeadSx = {
    ...baseHeadSx,
    position: "sticky" as const,
    top: 0,
    zIndex: Z_INDEX.WEEK_HEADER,
    // Both the shorthand and the longhand: MUI's theme applies a
    // semi-transparent `backgroundColor` to every head-variant TableCell
    // (see MuiTableCell.styleOverrides.head in style/theme.ts) — overriding
    // only `background` leaves that longhand rule in place, letting rows
    // scrolling underneath show through.
    background: `${paperBg} !important`,
    backgroundColor: `${paperBg} !important`,
    borderBottom: `1px solid ${tk.border} !important`,
  };

  const dayHeadSx = {
    ...baseHeadSx,
    position: "sticky" as const,
    top: dayRowTop,
    zIndex: Z_INDEX.DAY_HEADER,
    background: `${paperBg} !important`,
    backgroundColor: `${paperBg} !important`,
    borderBottom: `2px solid ${tk.border} !important`,
  };

  return (
    <Card
      ref={cardRef}
      variant="outlined"
      sx={{
        flex: 1,
        maxHeight: maxCardHeight,
        borderRadius: tk.radiusL,
        overflow: "hidden",
        borderColor: tk.border,
        boxShadow: tk.isDark
          ? "0 4px 32px rgba(0,0,0,0.4)"
          : "0 2px 20px rgba(13,27,42,0.08)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: tk.surface,
      }}
    >
      {/* Card header */}
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        gap={1.5}
        sx={{
          p: "10px 16px",
          borderBottom: `1px solid ${tk.border}`,
          flexShrink: 0,
          background: tk.isDark
            ? "linear-gradient(135deg,rgba(24,95,165,0.06),rgba(15,110,86,0.03))"
            : "linear-gradient(135deg,rgba(24,95,165,0.03),rgba(15,110,86,0.015))",
        }}
      >
        <ShiftLegend />
        <Box flex={1} />
        <Typography variant="caption" sx={{ color: tk.textSecondary, fontWeight: 500 }}>
          Showing{" "}
          <Box component="strong" sx={{ color: tk.textPrimary }}>
            {filtered.length}
          </Box>{" "}
          of {allEmpsCount} employees
        </Typography>
        <Chip
          icon={<LayersOutlinedIcon sx={{ fontSize: "13px !important" }} />}
          label="W1–W6 · 42 cols"
          size="small"
          variant="outlined"
          sx={{
            display: { xs: "none", md: "flex" },
            fontWeight: 650,
            height: 24,
            fontSize: 10.5,
            borderRadius: "6px",
            borderColor: tk.border,
            color: tk.textSecondary,
          }}
        />
        {editing && changedCount > 0 && (
          <Chip
            label={`${changedCount} unsaved`}
            size="small"
            color="warning"
            sx={{ height: 24, fontSize: 10.5, borderRadius: "6px", fontWeight: 650 }}
          />
        )}
      </Stack>

      {/* Brush bar */}
      {editing && editMode === "drag" && <BrushBar brush={brush} onSelect={setBrush} />}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, p: 4 }}>
          <CircularProgress size={36} />
        </Box>
      )}

      {/* ── TABLE ── */}
      {!isLoading && (
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            position: "relative",
            "&::-webkit-scrollbar": { width: 6, height: 6 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: tk.isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              borderRadius: 6,
              "&:hover": {
                bgcolor: tk.isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
              },
            },
          }}
        >
          {/*
            stickyHeader is intentionally omitted from <Table> — MUI's
            stickyHeader only auto-stickies the first TableHead row and
            injects a .MuiTableCell-stickyHeader class that fights the
            manual `top` values below. Every sticky position here is
            controlled explicitly via sx instead.
          */}
          <Table size="small">
            {/* ── TableHead ── */}
            <TableHead>
              {/* Row 1: Week headers — ref measures real height for row 2's `top` */}
              <TableRow ref={weekRowRef}>
                <TableCell
                  rowSpan={2}
                  sx={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: Z_INDEX.HEADER_CORNER + 10,
                    width: editing ? 40 : 0,
                    minWidth: editing ? 40 : 0,
                    maxWidth: editing ? 40 : 0,
                    p: 0,
                    background: `${empColBg} !important`,
                    backgroundColor: `${empColBg} !important`,
                    borderBottom: `2px solid ${tk.border} !important`,
                    borderRight: editing ? `0.5px solid ${tk.border} !important` : "none",
                    overflow: "hidden",
                    transition: "width .2s, min-width .2s",
                    willChange: "transform",
                  }}
                >
                  {editing && editMode === "select" && (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <Checkbox
                        size="small"
                        indeterminate={selectedRows.size > 0 && selectedRows.size < filtered.length}
                        checked={filtered.length > 0 && selectedRows.size === filtered.length}
                        onChange={(e) => (e.target.checked ? selectAllRows() : clearSelection())}
                        sx={{ p: 0.5 }}
                      />
                    </Box>
                  )}
                </TableCell>

                <TableCell
                  rowSpan={2}
                  sx={{
                    position: "sticky",
                    top: 0,
                    left: editing ? 40 : 0,
                    zIndex: Z_INDEX.HEADER_CORNER,
                    width: EMP_COL_W,
                    minWidth: EMP_COL_W,
                    maxWidth: EMP_COL_W,
                    background: `${empColBg} !important`,
                    backgroundColor: `${empColBg} !important`,
                    textAlign: "left",
                    borderBottom: `2px solid ${tk.border} !important`,
                    borderRight: `1.5px solid ${tk.border} !important`,
                    willChange: "transform",
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: tk.textSecondary }}>
                    Employee
                  </Typography>
                </TableCell>

                {Array.from({ length: 6 }, (_, w) => {
                  const weekCellBg =
                    w % 2 === 1
                      ? tk.isDark
                        ? "rgba(24,95,165,0.18)"
                        : "rgba(24,95,165,0.10)"
                      : weekHeaderBg;
                  return (
                    <TableCell
                      key={w}
                      colSpan={7}
                      onContextMenu={(e) => {
                        if (!editing || editMode !== "week") return;
                        e.preventDefault();
                        onWeekHeaderContextMenu(e.currentTarget as HTMLElement, w);
                      }}
                      sx={{
                        ...weekHeadSx,
                        width: (CELL_W + 6) * 7,
                        minWidth: (CELL_W + 6) * 7,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                        borderLeft: w > 0 ? `2.5px solid ${alpha(tk.textPrimary, 0.12)}` : undefined,
                        // weekCellBg is a translucent tint (alpha < 1), so
                        // assigning it directly as `background` (as the
                        // corner cell does with its opaque empColBg) lets
                        // body rows scrolling underneath show through the
                        // sticky header. Layering it as a gradient over an
                        // opaque paperBg base composites it to a flat,
                        // fully opaque color instead.
                        background: `linear-gradient(${weekCellBg}, ${weekCellBg}), ${paperBg} !important`,
                        backgroundColor: `${paperBg} !important`,
                        color: w % 2 === 1 ? tk.accent : tk.textSecondary,
                        cursor: editing && editMode === "week" ? "context-menu" : "default",
                        "&:hover":
                          editing && editMode === "week"
                            ? {
                                background: `linear-gradient(${alpha(tk.accent, 0.12)}, ${alpha(tk.accent, 0.12)}), ${paperBg} !important`,
                                backgroundColor: `${paperBg} !important`,
                              }
                            : undefined,
                      }}
                    >
                      Week {w + 1} 
                      {editing && editMode === "week" && (
                        <Typography
                          component="span"
                          sx={{ ml: 0.5, fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0, textTransform: "none" }}
                        >
                          (right-click)
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}

                {(["Work", "N", "OFF"] as const).map((h, i) => (
                  <TableCell
                    key={h}
                    rowSpan={2}
                    sx={{
                      ...weekHeadSx,
                      width: 48,
                      minWidth: 48,
                      borderLeft: i === 0 ? `2.5px solid ${alpha(tk.textPrimary, 0.12)}` : undefined,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>

              {/* Row 2: Day headers — top = measured week-row height.
                  Keyed on dayRowTop so that when the ResizeObserver corrects
                  it from the WEEK_ROW_H fallback to the real measured value,
                  React remounts this row instead of patching its `top`
                  in place. A live style patch to an already-stuck
                  `position: sticky` element's offset lets the browser keep a
                  stale sticky constraint calculated from the old value,
                  which only surfaces once you actually scroll past it (and
                  never self-corrects) — remounting forces a fresh layout. */}
              <TableRow key={dayRowTop}>
                {Array.from({ length: TOTAL_COLS }, (_, i) => {
                  const d = i % 7;
                  const w = Math.floor(i / 7);
                  const dayCellBg =
                    d >= 5 ? (tk.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : dayHeaderBg;
                  return (
                    <TableCell
                      key={i}
                      sx={{
                        ...dayHeadSx,
                        width: CELL_W + 6,
                        minWidth: CELL_W + 6,
                        fontSize: 10.5,
                        fontWeight: 600,
                        borderLeft: d === 0 && w > 0 ? `2.5px solid ${alpha(tk.textPrimary, 0.12)}` : undefined,
                        background: `linear-gradient(${dayCellBg}, ${dayCellBg}), ${paperBg} !important`,
                        backgroundColor: `${paperBg} !important`,
                      }}
                    >
                      {DOW_SHORT[d]}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            {/* ── TableBody ── */}
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TOTAL_COLS + 6}
                    sx={{ textAlign: "center", py: "48px", color: tk.textSecondary, fontSize: 13 }}
                  >
                    No employees match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
                  <GoldenGridEmployeeRow
                    key={emp.prefId}
                    emp={emp}
                    shifts={getShifts(emp)}
                    hasLocalChanges={!!localGrid[emp.prefId]}
                    isSelected={selectedRows.has(emp.prefId)}
                    editing={editing}
                    editMode={editMode}
                    tk={tk}
                    paperBg={paperBg}
                    warningColor={warningColor}
                    errorColor={errorColor}
                    onRowCheck={onRowCheck}
                    onCellMouseDown={onCellMouseDown}
                    onCellMouseEnter={onCellMouseEnter}
                  />
                ))
              )}
              {/* Reserves scroll runway equal to the sticky footer's height,
                  so the last real row can clear it instead of the footer
                  rendering on top of it. */}
              {footerHeight > 0 && (
                <TableRow aria-hidden style={{ height: footerHeight }}>
                  <TableCell
                    colSpan={TOTAL_COLS + 6}
                    sx={{ p: 0, border: "none" }}
                  />
                </TableRow>
              )}
            </TableBody>

            {/* ── TableFooter ── */}
            <TableFooter>
              <TableRow ref={footerRowRef}>
                <TableCell
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: Z_INDEX.FOOTER,
                    width: editing ? 40 : 0,
                    minWidth: editing ? 40 : 0,
                    p: 0,
                    background: `${empColBg} !important`,
                    borderTop: `2px solid ${tk.border}`,
                    willChange: "transform",
                  }}
                />
                <TableCell
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    left: editing ? 40 : 0,
                    zIndex: Z_INDEX.FOOTER_CORNER,
                    borderTop: `2px solid ${tk.border}`,
                    fontWeight: 600,
                    color: tk.textSecondary,
                    px: "14px",
                    py: "6px",
                    fontSize: 11,
                    textAlign: "left",
                    boxShadow: tk.isDark
                      ? "3px 0 8px -2px rgba(0,0,0,0.5)"
                      : "3px 0 8px -2px rgba(13,27,42,0.1)",
                    borderRight: `1.5px solid ${tk.border} !important`,
                    background: `${empColBg} !important`,
                    willChange: "transform",
                  }}
                >
                  Staffed / Day
                </TableCell>

                {dayTotals.map((c, i) => {
                  const d = i % 7;
                  const w = Math.floor(i / 7);
                  const wt = workingCount(c);
                  return (
                    <TableCell
                      key={i}
                      sx={{
                        position: "sticky",
                        bottom: 0,
                        zIndex: Z_INDEX.FOOTER,
                        background: `${empColBg} !important`,
                        borderTop: `2px solid ${tk.border}`,
                        fontFamily: MONO,
                        fontWeight: 700,
                        fontSize: 11,
                        textAlign: "center",
                        py: "6px",
                        px: "4px",
                        borderLeft: d === 0 && w > 0 ? `2.5px solid ${alpha(tk.textPrimary, 0.12)}` : undefined,
                        willChange: "transform",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontFamily: MONO,
                          fontWeight: 700,
                          color: wt < 5 ? "error.main" : wt > 15 ? "warning.main" : tk.textPrimary,
                        }}
                      >
                        {wt}
                      </Typography>
                    </TableCell>
                  );
                })}
                <TableCell
                  colSpan={3}
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: Z_INDEX.FOOTER,
                    background: `${empColBg} !important`,
                    borderTop: `2px solid ${tk.border}`,
                    willChange: "transform",
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
