import type { ReactNode } from "react";
import type { useTabColorTokens } from "../../../style/theme";

export type TabColorTokens = ReturnType<typeof useTabColorTokens>;

export type RosterAccent = "accent" | "success";

export interface RosterTabConfig {
  id: string;
  label: string;
  metaLabel: string;
  icon: ReactNode;
  accent: RosterAccent;
}
