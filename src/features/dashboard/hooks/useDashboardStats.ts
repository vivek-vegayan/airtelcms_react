import { useDashboardAssignments } from "./useDashboardAssignments";
import { useDashboardHolidays } from "./useDashboardHolidays";
import { useDashboardLeaveTeam } from "./useDashboardLeaveTeam";
import type { StatCardConfig } from "../types/dashboard.types";

/**
 * Derives the 4 KPI tiles from data already fetched by the other dashboard widgets
 * (RTK Query dedupes these calls against the widgets' own hooks — no extra network requests).
 */
export function useDashboardStats(): StatCardConfig[] {
  const { totalCount, doneCount } = useDashboardAssignments();
  const { team } = useDashboardLeaveTeam();
  const { holidays } = useDashboardHolidays();

  const nextHoliday = holidays[0];

  return [
    {
      key: "assignments",
      label: "Today's assignments",
      display: totalCount,
      sub: totalCount === 0 ? "Nothing scheduled" : `${doneCount} done`,
      tone: "accent",
      icon: "trending",
    },
    {
      key: "pending",
      label: "Pending",
      display: totalCount - doneCount,
      sub: totalCount === 0 ? "—" : "Remaining today",
      tone: "warning",
      icon: "clock",
    },
    {
      key: "onLeave",
      label: "On leave today",
      display: team.length,
      sub: team.length === 0 ? "Full team available" : "Across your team",
      tone: "info",
      icon: "calendar",
    },
    {
      key: "holiday",
      label: "Next holiday",
      display: nextHoliday?.countdown ?? "—",
      sub: nextHoliday ? `${nextHoliday.name} · ${nextHoliday.month} ${nextHoliday.day}` : "None scheduled",
      tone: "success",
      icon: "event",
    },
  ];
}
