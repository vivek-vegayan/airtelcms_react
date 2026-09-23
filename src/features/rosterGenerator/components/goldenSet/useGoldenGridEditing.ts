import { useCallback, useEffect, useRef, useState } from "react";
import { useUpdateDailyGoldenSetMutation } from "../../api/rosterGenerationApiSlice";
import { TOTAL_COLS } from "./goldenGrid.constants";
import type { EditMode, GoldenSetEmployee, HistoryEntry } from "./goldenGrid.types";
import { buildDailyGoldenSetPayload } from "./goldenGrid.utils";

type UpdateDailyGoldenSet = ReturnType<
  typeof useUpdateDailyGoldenSetMutation
>[0];

export function useGoldenGridEditing(
  allEmps: GoldenSetEmployee[],
  updateDailyGoldenSet: UpdateDailyGoldenSet,
) {
  // ── Local paint grid ──────────────────────────────────────────────────────
  const [localGrid, setLocalGrid] = useState<Record<number, string[]>>({});

  const getShifts = useCallback(
    (emp: GoldenSetEmployee): string[] => localGrid[emp.prefId] ?? emp.shifts,
    [localGrid],
  );

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("select");
  const [brush, setBrush] = useState("G");

  // Row selection
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Bulk apply scope
  const [bulkWeek, setBulkWeek] = useState<number | "all">("all");
  const [bulkDay, setBulkDay] = useState<number | "all">("all");

  // Undo/redo
  const [editHistory, setEditHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Drag painting
  const painting = useRef(false);
  const dragStarted = useRef(false);

  // Week-override popover
  const [weekPopover, setWeekPopover] = useState<{
    anchorEl: HTMLElement;
    weekIdx: number;
  } | null>(null);

  const [toast, setToast] = useState<{
    msg: string;
    severity: "success" | "error";
  } | null>(null);

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const pushHistory = useCallback(
    (grid: Record<number, string[]>) => {
      const snap: HistoryEntry = { grid: JSON.parse(JSON.stringify(grid)) };
      setEditHistory((prev) => {
        const next = prev.slice(0, historyIdx + 1);
        next.push(snap);
        return next;
      });
      setHistoryIdx((i) => i + 1);
    },
    [historyIdx],
  );

  const handleUndo = useCallback(() => {
    if (historyIdx < 0) return;
    const prevEntry = historyIdx > 0 ? editHistory[historyIdx - 1] : null;
    setLocalGrid(prevEntry ? JSON.parse(JSON.stringify(prevEntry.grid)) : {});
    setHistoryIdx((i) => i - 1);
  }, [historyIdx, editHistory]);

  const handleRedo = useCallback(() => {
    if (historyIdx >= editHistory.length - 1) return;
    const nextEntry = editHistory[historyIdx + 1];
    setLocalGrid(JSON.parse(JSON.stringify(nextEntry.grid)));
    setHistoryIdx((i) => i + 1);
  }, [historyIdx, editHistory]);

  const canUndo = historyIdx >= 0;
  const canRedo = historyIdx < editHistory.length - 1;

  const clearSelection = useCallback(() => setSelectedRows(new Set()), []);

  // ── Bulk apply ────────────────────────────────────────────────────────────
  const handleBulkApply = useCallback(
    (code: string) => {
      if (selectedRows.size === 0) return;
      pushHistory(localGrid);
      setLocalGrid((prev) => {
        const next = { ...prev };
        selectedRows.forEach((prefId) => {
          const emp = allEmps.find((e) => e.prefId === prefId);
          if (!emp) return;
          const base = next[prefId] ? [...next[prefId]] : [...emp.shifts];
          for (let i = 0; i < TOTAL_COLS; i++) {
            const w = Math.floor(i / 7);
            const d = i % 7;
            if (bulkWeek !== "all" && w !== bulkWeek) continue;
            if (bulkDay !== "all" && d !== bulkDay) continue;
            base[i] = code;
          }
          next[prefId] = base;
        });
        return next;
      });
      setToast({
        msg: `Applied "${code}" to ${selectedRows.size} employee${selectedRows.size !== 1 ? "s" : ""}`,
        severity: "success",
      });
    },
    [selectedRows, localGrid, allEmps, bulkWeek, bulkDay, pushHistory],
  );

  // ── Cell paint (drag mode) ────────────────────────────────────────────────
  const paintCell = useCallback(
    (prefId: number, colIdx: number) => {
      setLocalGrid((prev) => {
        const base =
          prev[prefId] ??
          allEmps.find((e) => e.prefId === prefId)?.shifts ??
          [];
        const next = [...base];
        if (next[colIdx] === brush) return prev;
        next[colIdx] = brush;
        return { ...prev, [prefId]: next };
      });
    },
    [brush, allEmps],
  );

  const handleCellMouseDown = useCallback(
    (prefId: number, colIdx: number) => {
      painting.current = true;
      dragStarted.current = false;
      if (!dragStarted.current) {
        pushHistory(localGrid);
        dragStarted.current = true;
      }
      paintCell(prefId, colIdx);
    },
    [localGrid, paintCell, pushHistory],
  );

  const handleCellMouseEnter = useCallback(
    (prefId: number, colIdx: number) => {
      if (!painting.current || editMode !== "drag") return;
      paintCell(prefId, colIdx);
    },
    [editMode, paintCell],
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSaveChanges = useCallback(async () => {
    const changedPrefIds = Object.keys(localGrid).map(Number);
    if (changedPrefIds.length === 0) {
      setToast({ msg: "No changes to save", severity: "success" });
      return;
    }
    const payload = allEmps
      .filter((e) => changedPrefIds.includes(e.prefId))
      .map((e) => buildDailyGoldenSetPayload({ ...e, shifts: getShifts(e) }));
    try {
      await updateDailyGoldenSet(payload).unwrap();
      setToast({
        msg: `Saved ${payload.length} employee(s) successfully`,
        severity: "success",
      });
      setLocalGrid({});
      setEditHistory([]);
      setHistoryIdx(-1);
      setSelectedRows(new Set());
      setEditing(false);
    } catch (err) {
      console.error("Failed to save:", err);
      setToast({
        msg: "Failed to save changes. Please try again.",
        severity: "error",
      });
    }
  }, [localGrid, allEmps, getShifts, updateDailyGoldenSet]);

  // ── Discard ───────────────────────────────────────────────────────────────
  const handleDiscard = useCallback(() => {
    setLocalGrid({});
    setEditHistory([]);
    setHistoryIdx(-1);
    setSelectedRows(new Set());
    setEditing(false);
    setToast({ msg: "Changes discarded", severity: "success" });
  }, []);

  useEffect(() => {
    const up = () => {
      painting.current = false;
      dragStarted.current = false;
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const changedCount = Object.keys(localGrid).length;

  return {
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
    editHistory,
    historyIdx,
    pushHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    painting,
    dragStarted,
    weekPopover,
    setWeekPopover,
    handleBulkApply,
    paintCell,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleSaveChanges,
    handleDiscard,
    changedCount,
    toast,
    setToast,
  };
}
