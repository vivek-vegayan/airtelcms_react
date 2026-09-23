import { useState, useEffect, useCallback } from "react";

export interface SelectionState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<SelectionState>({
    text: "",
    x: 0,
    y: 0,
    visible: false,
  });

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";

    if (!text || text.length < 2) {
      setSelection((prev) => ({ ...prev, visible: false }));
      return;
    }

    if (containerRef.current && sel?.anchorNode) {
      if (!containerRef.current.contains(sel.anchorNode)) {
        setSelection((prev) => ({ ...prev, visible: false }));
        return;
      }
    }

    const range = sel?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (rect) {
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
        visible: true,
      });
    }
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    setSelection((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  return { selection, clearSelection };
}
