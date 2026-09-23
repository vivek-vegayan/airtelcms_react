import { useEffect } from "react";
import { SHIFT_CODES } from "./goldenGrid.constants";
import type { EditMode } from "./goldenGrid.types";

interface UseGoldenGridKeyboardShortcutsArgs {
  editing: boolean;
  editMode: EditMode;
  setBrush: (code: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleSaveChanges: () => void | Promise<void>;
  selectAllRows: () => void;
  clearSelection: () => void;
}

export function useGoldenGridKeyboardShortcuts({
  editing,
  editMode,
  setBrush,
  handleUndo,
  handleRedo,
  handleSaveChanges,
  selectAllRows,
  clearSelection,
}: UseGoldenGridKeyboardShortcutsArgs) {
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSaveChanges();
        return;
      }
      if (e.ctrlKey && e.key === "a" && editMode === "select") {
        e.preventDefault();
        selectAllRows();
        return;
      }
      if (e.key === "Escape") {
        clearSelection();
        return;
      }
      if (editMode === "drag" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const upper = e.key.toUpperCase();
        if (SHIFT_CODES.includes(upper) && upper.length === 1) setBrush(upper);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    editing,
    editMode,
    setBrush,
    handleUndo,
    handleRedo,
    handleSaveChanges,
    selectAllRows,
    clearSelection,
  ]);
}
