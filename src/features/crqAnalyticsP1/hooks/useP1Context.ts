import { createContext, useContext } from "react";
import type { UseP1FiltersReturn } from "./useP1Filters";
import type { P1Colors } from "../utils/p1Colors";
import type { P1Drill } from "../types/crqAnalyticsP1.types";

export interface P1ContextValue {
  /** Filters, date range and the pinned "now" shared by every card. */
  f: UseP1FiltersReturn;
  colors: P1Colors;
  /** Opens the CRQ list behind a clicked number. */
  openDrill: (drill: P1Drill) => void;
  /** Window of the "last N months" cards (6 or 12). */
  months: number;
  setMonths: (months: number) => void;
}

export const P1Context = createContext<P1ContextValue | null>(null);

export function useP1(): P1ContextValue {
  const ctx = useContext(P1Context);
  if (!ctx) throw new Error("useP1 must be used inside the CRQ Analytics Phase 1 page");
  return ctx;
}
