import { Box } from "@mui/material";
import { useState, useMemo, useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getMonthRange, getWeekRange } from "../utils/dateRange.utils";
import { MonthlyRosterMain } from "../monthly/MonthlyRosterMain";
import { WeeklyRosterMain } from "../weekly/WeeklyRosterMain";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useApiRefresh, type ApiTag } from "../../../hooks/useApiRefresh";
import { authStorage } from "../../../app/store/auth.storage";
import {
  RosterViewSwitch,
  type RosterViewMode,
} from "./components/RosterViewSwitch";
import { RosterDateNavigator } from "./components/RosterDateNavigator";
import { RosterImportDialog } from "../components/dialog/RosterImportDialog";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePermission } from "../../auth/hooks/usePermission";


// The grid itself lives in Weekly/MonthlyRosterMain. Invalidating the tag both
// of them provide refetches whichever one is on screen, so the filter bar needs
// no refetch handle from its children.
const ROSTER_TAGS: ApiTag[] = ["RosterVIew"];

export const RosterViewMain = () => {
  const [view, setView] = useState<RosterViewMode>("weekly");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const { values, handleChange } = useOrgHierarchyState("rosterView");
  const { options } = useOrgHierarchyFilters(values);
  const { refresh, isRefreshing } = useApiRefresh({ tags: ROSTER_TAGS });

  const domainId = values.domain;
  const subDomainId = values.subDomain;

  // Excel import: the dialog lives here (not in the grid's toolbar) because
  // this component stays mounted when the grid switches between "not
  // generated" and the roster table – e.g. right after a save.
  const [importOpen, setImportOpen] = useState(false);
  const { role } = useAuth();
  const { hasPermission } = usePermission();
  const canImport =
    hasPermission("Roster Management", "UPDATE") || role === "SUPER_ADMIN";
  const openImport = canImport ? () => setImportOpen(true) : undefined;

  const { startDate, endDate } = useMemo(() => {
    return view === "monthly"
      ? getMonthRange(selectedDate)
      : getWeekRange(selectedDate);
  }, [view, selectedDate]);

  // Navigate back: -1 month or -1 week
  const handlePrev = useCallback(() => {
    setSelectedDate((prev) =>
      view === "monthly" ? prev.subtract(1, "month") : prev.subtract(1, "week"),
    );
  }, [view]);

  // Navigate forward: +1 month or +1 week
  const handleNext = useCallback(() => {
    setSelectedDate((prev) =>
      view === "monthly" ? prev.add(1, "month") : prev.add(1, "week"),
    );
  }, [view]);

  // Label: "Apr 2026" for monthly, "Mar 30 – Apr 5" for weekly
  const dateLabel = useMemo(() => {
    if (view === "monthly") {
      return selectedDate.format("MMM YYYY");
    } else {
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      const sameMonth = start.month() === end.month();
      return sameMonth
        ? `${start.format("MMM D")} – ${end.format("D")}`
        : `${start.format("MMM D")} – ${end.format("MMM D")}`;
    }
  }, [view, selectedDate, startDate, endDate]);

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <RosterViewSwitch value={view} onChange={setView} />

          <RosterDateNavigator
            label={dateLabel}
            labelMinWidth={view === "monthly" ? 80 : 120}
            onPrev={handlePrev}
            onNext={handleNext}
          />

          <OrgHierarchyFilters
            role={roleName}
            values={values}
            options={options}
            onChange={handleChange}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            refreshDisabled={subDomainId == null}
            refreshTooltip={
              subDomainId != null ? "Refresh roster" : "Pick a Sub Domain first"
            }
          />
        </Box>
      </LocalizationProvider>

      {/* ===== VIEW RENDER ===== */}
      <Box mt={2}>
        {view === "weekly" ? (
          <WeeklyRosterMain
            domainId={domainId}
            subDomainId={subDomainId}
            startDate={startDate}
            endDate={endDate}
            onImport={openImport}
          />
        ) : (
          <MonthlyRosterMain
            startDate={startDate}
            endDate={endDate}
            domainId={domainId}
            subDomainId={subDomainId}
            onImport={openImport}
          />
        )}
      </Box>

      <RosterImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        startDate={startDate}
        endDate={endDate}
        domainId={domainId}
        subDomainId={subDomainId}
      />
    </>
  );
};
