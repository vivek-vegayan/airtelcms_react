import { useCallback, useRef, useState } from "react";
import { Alert, Box, Snackbar, Typography, useTheme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";

import RosterFilterDrawer from "./RosterFilterDrawer";
import { TOTAL_COLS } from "./goldenGrid.constants";
import type { GoldenGridScreenProps } from "./goldenGrid.types";
import { useGoldenGridTokens } from "./useGoldenGridTokens";
import { useGoldenGridData } from "./useGoldenGridData";
import { useGoldenGridEditing } from "./useGoldenGridEditing";
import { useGoldenGridFilters } from "./useGoldenGridFilters";
import { useGoldenGridKeyboardShortcuts } from "./useGoldenGridKeyboardShortcuts";
import GoldenGridToolbar from "./GoldenGridToolbar";
import GoldenGridBulkActionBar from "./GoldenGridBulkActionBar";
import GoldenGridHintBanner from "./GoldenGridHintBanner";
import GoldenGridWeekOverridePopover from "./GoldenGridWeekOverridePopover";
import GoldenGridTable from "./GoldenGridTable";
import AnalyticsModal from "./AnalyticsModal";

export default function GoldenGridScreen({
  subTeamId,
}: GoldenGridScreenProps) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);

  // ── API ───────────────────────────────────────────────────────────────────
  const subDomainId =
    typeof subTeamId === "string" ? parseInt(subTeamId, 10) : (subTeamId ?? 0);

  const { allEmps, allRoles, isLoading, error, refetch, updateDailyGoldenSet, isSaving } =
    useGoldenGridData(subDomainId);

  const editing_ = useGoldenGridEditing(allEmps, updateDailyGoldenSet);
  const {
    localGrid,
    setLocalGrid,
    getShifts,
    editing,
    setEditing,
    editMode,
    setEditMode,
    brush,
    setBrush,
    selectedRows,
    setSelectedRows,
    clearSelection,
    bulkWeek,
    setBulkWeek,
    bulkDay,
    setBulkDay,
    pushHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    weekPopover,
    setWeekPopover,
    handleBulkApply,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleSaveChanges,
    handleDiscard,
    changedCount,
    toast,
    setToast,
  } = editing_;

  const {
    searchRaw,
    setSearchRaw,
    filter,
    setFilter,
    filterOpen,
    setFilterOpen,
    sort,
    setSort,
    filtered,
    dayTotals,
    activeFilters,
  } = useGoldenGridFilters(allEmps, getShifts);

  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // ── Cross-cutting handlers (need both `filtered` and the editing state) ───
  const lastSelectedRowRef = useRef<number | null>(null);

  const handleRowCheck = useCallback(
    (prefId: number, checked: boolean, shiftKey: boolean) => {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        const ids = filtered.map((e) => e.prefId);
        if (shiftKey && lastSelectedRowRef.current !== null) {
          const a = ids.indexOf(lastSelectedRowRef.current);
          const b = ids.indexOf(prefId);
          const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
          for (let i = lo; i <= hi; i++) {
            if (checked) next.add(ids[i]);
            else next.delete(ids[i]);
          }
        } else {
          if (checked) next.add(prefId);
          else next.delete(prefId);
          lastSelectedRowRef.current = prefId;
        }
        return next;
      });
    },
    [filtered, setSelectedRows],
  );

  const selectAllRows = useCallback(() => {
    setSelectedRows(new Set(filtered.map((e) => e.prefId)));
  }, [filtered, setSelectedRows]);

  const handleWeekOverride = useCallback(
    (code: string, weekIdx: number) => {
      const targets =
        selectedRows.size > 0
          ? filtered.filter((e) => selectedRows.has(e.prefId))
          : filtered;

      pushHistory(localGrid);
      setLocalGrid((prev) => {
        const next = { ...prev };
        targets.forEach((emp) => {
          const base = next[emp.prefId] ? [...next[emp.prefId]] : [...emp.shifts];
          for (let d = 0; d < 7; d++) base[weekIdx * 7 + d] = code;
          next[emp.prefId] = base;
        });
        return next;
      });
      setWeekPopover(null);
      setToast({
        msg: `Set Week ${weekIdx + 1} → "${code}" for ${targets.length} employee${targets.length !== 1 ? "s" : ""}`,
        severity: "success",
      });
    },
    [selectedRows, filtered, localGrid, pushHistory, setLocalGrid, setWeekPopover, setToast],
  );

  const onWeekHeaderContextMenu = useCallback(
    (anchorEl: HTMLElement, weekIdx: number) => {
      setWeekPopover({ anchorEl, weekIdx });
    },
    [setWeekPopover],
  );

  const downloadCsv = useCallback(() => {
    const header = [
      "Name",
      "OLM ID",
      "Role",
      "Level",
      ...Array.from(
        { length: TOTAL_COLS },
        (_, i) => `W${Math.floor(i / 7) + 1}D${(i % 7) + 1}`,
      ),
    ];
    const rows = filtered.map((e) =>
      [e.name, e.olmid, e.role, e.level, ...getShifts(e)].join(","),
    );
    const url = URL.createObjectURL(
      new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "golden-set.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "CSV exported", severity: "success" });
  }, [filtered, getShifts, setToast]);

  useGoldenGridKeyboardShortcuts({
    editing,
    editMode,
    setBrush,
    handleUndo,
    handleRedo,
    handleSaveChanges,
    selectAllRows,
    clearSelection,
  });

  // ── Render guards ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Failed to load roster data
          </Typography>
          <Typography variant="body2">
            {typeof error === "object" && error !== null && "data" in error
              ? String((error as { data?: unknown }).data)
              : "An error occurred. Please try again."}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!isLoading && (!allEmps || allEmps.length === 0)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography>
            No roster data available. Please check your configuration and try
            again.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        p: 1.5,
        gap: 1,
        bgcolor: tk.bg,
        "@keyframes tkPulse": {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
        "@keyframes fadeSlideIn": {
          from: { opacity: 0, transform: "translateY(-6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <GoldenGridToolbar
        searchRaw={searchRaw}
        setSearchRaw={setSearchRaw}
        activeFilters={activeFilters}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        sort={sort}
        setSort={setSort}
        setAnalyticsOpen={setAnalyticsOpen}
        editing={editing}
        canUndo={canUndo}
        handleUndo={handleUndo}
        canRedo={canRedo}
        handleRedo={handleRedo}
        editMode={editMode}
        setEditMode={setEditMode}
        clearSelection={clearSelection}
        changedCount={changedCount}
        setEditing={setEditing}
        isSaving={isSaving}
        handleSaveChanges={handleSaveChanges}
        handleDiscard={handleDiscard}
        downloadCsv={downloadCsv}
        refetch={refetch}
      />

      <RosterFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filter={filter}
        allRoles={allRoles}
        onApply={setFilter}
        sort={sort}
        onSortChange={setSort}
      />

      {editing && editMode === "select" && selectedRows.size > 0 && (
        <GoldenGridBulkActionBar
          selectedCount={selectedRows.size}
          filteredCount={filtered.length}
          onSelectAll={selectAllRows}
          onClear={clearSelection}
          bulkWeek={bulkWeek}
          setBulkWeek={setBulkWeek}
          bulkDay={bulkDay}
          setBulkDay={setBulkDay}
          onApplyShift={handleBulkApply}
        />
      )}

      {editing && editMode === "select" && selectedRows.size === 0 && (
        <GoldenGridHintBanner
          icon={<CheckBoxOutlineBlankIcon sx={{ fontSize: 15, color: tk.textDim }} />}
        >
          Check rows to select employees · <strong>Shift+click</strong> for
          range selection · <strong>Ctrl+A</strong> to select all
        </GoldenGridHintBanner>
      )}

      {editing && editMode === "week" && (
        <GoldenGridHintBanner
          icon={<CalendarViewWeekIcon sx={{ fontSize: 15, color: tk.textDim }} />}
        >
          <strong>Right-click</strong> any "Week N" column header to override
          all 7 days at once ·
          {selectedRows.size > 0
            ? ` Applies to ${selectedRows.size} selected row${selectedRows.size !== 1 ? "s" : ""}`
            : " Applies to all visible rows"}
        </GoldenGridHintBanner>
      )}

      <GoldenGridTable
        allEmpsCount={allEmps.length}
        filtered={filtered}
        dayTotals={dayTotals}
        getShifts={getShifts}
        localGrid={localGrid}
        selectedRows={selectedRows}
        editing={editing}
        editMode={editMode}
        brush={brush}
        setBrush={setBrush}
        changedCount={changedCount}
        isLoading={isLoading}
        onRowCheck={handleRowCheck}
        onCellMouseDown={handleCellMouseDown}
        onCellMouseEnter={handleCellMouseEnter}
        onWeekHeaderContextMenu={onWeekHeaderContextMenu}
        selectAllRows={selectAllRows}
        clearSelection={clearSelection}
      />

      <GoldenGridWeekOverridePopover
        weekPopover={weekPopover}
        onClose={() => setWeekPopover(null)}
        selectedCount={selectedRows.size}
        visibleCount={filtered.length}
        onApply={handleWeekOverride}
      />

      <AnalyticsModal
        open={analyticsOpen}
        emps={filtered}
        onClose={() => setAnalyticsOpen(false)}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.severity ?? "success"}
          variant="filled"
          icon={toast?.severity === "success" ? <CheckIcon /> : undefined}
          sx={{ alignItems: "center", borderRadius: tk.radiusL }}
          onClose={() => setToast(null)}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
