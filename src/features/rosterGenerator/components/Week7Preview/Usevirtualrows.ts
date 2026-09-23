import { useState, useEffect, useCallback, type RefObject } from "react";
import type { NormalisedEmployee } from "../../types/Futureweek.types";

export const VIRTUAL_ROW_HEIGHT = 44;
const OVERSCAN = 8;

interface VirtualState {
  visibleRows: NormalisedEmployee[];
  paddingTop: number;
  paddingBottom: number;
}

export function useVirtualRows(
  employees: NormalisedEmployee[],
  containerRef: RefObject<HTMLElement | null>,
): VirtualState {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewportHeight(el.clientHeight);
    setScrollTop(el.scrollTop);

    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, handleScroll]);

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - OVERSCAN,
  );
  const endIndex = Math.min(
    employees.length,
    Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ROW_HEIGHT) + OVERSCAN,
  );

  return {
    visibleRows: employees.slice(startIndex, endIndex),
    paddingTop: startIndex * VIRTUAL_ROW_HEIGHT,
    paddingBottom: Math.max(0, (employees.length - endIndex) * VIRTUAL_ROW_HEIGHT),
  };
}