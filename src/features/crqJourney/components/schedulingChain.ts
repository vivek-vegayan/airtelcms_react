import type React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import type { CrqJourneyFlow, CrqJourneyStageRow, StepStatus } from "../types/crqJourney.types";
import {
  formatStageName,
  formatStatusLabel,
  getStepStatusConfig,
  normalizeStepStatus,
} from "../utils/crqJourney.utils";

export interface SchedulingChainItem {
  key: string;
  row: CrqJourneyStageRow;
  label: string;
  statusLabel: string;
  icon: React.ElementType;
  tone: { color: string; bgColor: string; borderColor: string };
  status: StepStatus;
  pulse: boolean;
}

/**
 * The scheduling column: SCHEDULING → CAB → CONFLICT CHECK, in that order,
 * skipping whichever the proc didn't return.
 *
 * SCHEDULING speaks the normal stage vocabulary. CAB and CONFLICT CHECK answer
 * a plain YES/NO — "is this CRQ mapped into a CAB session" and "was a clash
 * found" — so showing their raw word would read as a status when it isn't.
 * Each gets an explicit label and borrows an existing status tone rather than
 * introducing new colours.
 */
export const buildSchedulingChain = (flow: CrqJourneyFlow, isDark: boolean): SchedulingChainItem[] => {
  const cfg = getStepStatusConfig(isDark);
  const toTone = (s: StepStatus) => ({
    color: cfg[s].color,
    bgColor: cfg[s].bgColor,
    borderColor: cfg[s].borderColor,
  });

  const items: SchedulingChainItem[] = [];

  if (flow.scheduling) {
    const status = normalizeStepStatus(flow.scheduling.status);
    items.push({
      key: "scheduling",
      row: flow.scheduling,
      label: formatStageName(flow.scheduling.stage),
      statusLabel: formatStatusLabel(flow.scheduling.status),
      icon: CalendarMonthRoundedIcon,
      tone: toTone(status),
      status,
      pulse: status === "in_progress" || status === "pending",
    });
  }

  if (flow.cab) {
    const mapped = flow.cab.status.trim().toUpperCase() === "YES";
    const status: StepStatus = mapped ? "completed" : "not_started";
    items.push({
      key: "cab",
      row: flow.cab,
      label: "CAB",
      statusLabel: mapped ? "Session Mapped" : "Not Mapped",
      icon: GroupsRoundedIcon,
      tone: toTone(status),
      status,
      pulse: false,
    });
  }

  if (flow.conflictCheck) {
    const clash = flow.conflictCheck.status.trim().toUpperCase() === "YES";
    const status: StepStatus = clash ? "cancelled" : "completed";
    items.push({
      key: "conflict",
      row: flow.conflictCheck,
      label: "Conflict Check",
      statusLabel: clash ? "Conflict Found" : "No Conflict",
      icon: SecurityRoundedIcon,
      tone: toTone(status),
      status,
      pulse: clash,
    });
  }

  return items;
};
