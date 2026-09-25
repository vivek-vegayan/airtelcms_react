import { useCallback, useMemo, useState } from "react";
import { Box, Button, TableBody, TableHead, TableRow } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import dayjs from "dayjs";
import { useGetRosterViewQuery } from "../api/rosterApiSlice";
import { RosterToolbar } from "../components/RosterToolbar";
import { RosterTableFrame } from "../components/table/RosterTableFrame";
import { RosterDayHeaderCell } from "../components/table/RosterDayHeaderCell";
import { RosterEmployeeHeaderCell } from "../components/table/RosterEmployeeHeaderCell";
import {
  RosterEmptyRow,
  RosterNotGeneratedPlaceholder,
  SelectFilterPlaceholder,
} from "../components/table/RosterTableStates";
import { ShiftLegend } from "../components/ShiftLegend";
import { SHIFT_COLOR_MAP, resolveShiftKeyFromDisplay } from "../constant/shiftPalette";
import { filterRosterUsers } from "../utils/rosterFilter.utils";
import { exportRosterToExcel } from "../utils/rosterExcelExport";
import { MonthlyRosterRow } from "./MonthlyRosterRow";
import { CoverageSummaryRow } from "./CoverageSummaryRow";
import {
  ShiftDetailDialog,
  type ShiftDetailData,
} from "./ShiftDetailDialog";
import type { ShiftInfo, UserRoster } from "../types/monthlyRoster.type";

interface Props {
  startDate: string;
  endDate: string;
  domainId?: number;
  subDomainId?: number;
  /** Opens the Excel import dialog (owned by RosterViewMain). */
  onImport?: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export const MonthlyRosterMain = ({
  startDate,
  endDate,
  domainId,
  subDomainId,
  onImport,
}: Props) => {
  /* ── State ──────────────────────────────────────────────────────────── */
  const [detailedView, setDetailedView] = useState(false);
  const [filterShift, setFilterShift] = useState<string[]>([]);
  const [filterLevel, setFilterLevel] = useState<string[]>([]);
  const [highlightShift, setHighlightShift] = useState("");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [selectedShiftModal, setSelectedShiftModal] =
    useState<ShiftDetailData | null>(null);

  /* ── API ────────────────────────────────────────────────────────────── */
  const shouldSkip = subDomainId == null;
  const { data, isFetching, isError } = useGetRosterViewQuery(
    {
      domainId: domainId ?? 0,
      subDomainId: subDomainId ?? 0,
      startDate,
      endDate,
    },
    { skip: shouldSkip },
  );

  /* ── Dates ──────────────────────────────────────────────────────────── */
  const allDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    const dates: string[] = [];
    let cur = dayjs(startDate);
    const end = dayjs(endDate);
    while (cur.isBefore(end) || cur.isSame(end, "day")) {
      dates.push(cur.format("YYYY-MM-DD"));
      cur = cur.add(1, "day");
    }
    return dates;
  }, [startDate, endDate]);

  const weekendFlags = useMemo(
    () => allDates.map((d) => [0, 6].includes(dayjs(d).day())),
    [allDates],
  );

  const todayStr = dayjs().format("YYYY-MM-DD");

  /* ── Derived data ───────────────────────────────────────────────────── */
  const users: UserRoster[] = useMemo(() => data?.data ?? [], [data]);

  const filteredUsers = useMemo(
    () =>
      filterRosterUsers(users, {
        searchTerms,
        filterLevel,
        filterShift,
        dates: allDates,
      }),
    [users, searchTerms, filterShift, filterLevel, allDates],
  );

  const dailyCoverage = useMemo(
    () =>
      allDates.map((date) => {
        let n = 0;
        filteredUsers.forEach((u) => {
          const k = resolveShiftKeyFromDisplay(u.roster?.[date]?.shiftDisplay);
          if (k !== "W" && k !== "L") n++;
        });
        return n;
      }),
    [filteredUsers, allDates],
  );

  const jobLevels = useMemo(
    () => Array.from(new Set(users.map((u) => u.jobLevel))).sort(),
    [users],
  );

  const usedShiftKeys = useMemo(() => {
    const s = new Set<string>();
    filteredUsers.forEach((u) =>
      allDates.forEach((d) =>
        s.add(resolveShiftKeyFromDisplay(u.roster?.[d]?.shiftDisplay)),
      ),
    );
    return Array.from(s).filter((k) => SHIFT_COLOR_MAP[k]);
  }, [filteredUsers, allDates]);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleOpenDetail = useCallback(
    (user: UserRoster, date: string, shift?: ShiftInfo) =>
      setSelectedShiftModal({ user, date, shift }),
    [],
  );

  const handleToggleHighlight = useCallback(
    (key: string) => setHighlightShift((prev) => (prev === key ? "" : key)),
    [],
  );

  /* ── Guards ─────────────────────────────────────────────────────────── */
  if (shouldSkip) return <SelectFilterPlaceholder />;
  // Not generated yet: no toolbar here, so show Import on its own.
  if (isError || data?.success === false || !users.length)
    return (
      <Box>
        {onImport && (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onImport}
              startIcon={<FileUploadOutlinedIcon />}
            >
              Import
            </Button>
          </Box>
        )}
        <RosterNotGeneratedPlaceholder />
      </Box>
    );

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <Box>
      {/* Toolbar (shared with the Weekly view; no swap controls here) */}
      <RosterToolbar
        domainId={domainId}
        subDomainId={subDomainId}
        searchTerms={searchTerms}
        onSearchChange={setSearchTerms}
        isDetailed={detailedView}
        onToggleDetailed={() => setDetailedView((p) => !p)}
        filterShift={filterShift}
        onFilterShiftChange={setFilterShift}
        filterLevel={filterLevel}
        onFilterLevelChange={setFilterLevel}
        jobLevels={jobLevels}
        highlightShift={highlightShift}
        onHighlightShiftChange={setHighlightShift}
        searchInputId="monthly-roster-search-input"
        onExport={() =>
          exportRosterToExcel({
            users: filteredUsers,
            dates: allDates,
            viewLabel: "Monthly",
          })
        }
        onImport={onImport}
      />

      {/* Table */}
      <RosterTableFrame
        height={450}
        loading={isFetching}
        tableSx={
          detailedView
            ? {
                tableLayout: "auto",
                width: "max-content",
                minWidth: 1400,
              }
            : undefined
        }
      >
        {/* ── Head ───────────────────────────────────────────── */}
        <TableHead>
          <TableRow>
            <RosterEmployeeHeaderCell count={filteredUsers.length} />
            {allDates.map((date, i) => (
              <RosterDayHeaderCell
                key={date}
                date={date}
                isToday={date === todayStr}
                isWeekend={weekendFlags[i]}
                minWidth={detailedView ? 130 : 34}
              />
            ))}
          </TableRow>
        </TableHead>

        {/* ── Body ───────────────────────────────────────────── */}
        <TableBody>
          {filteredUsers.length === 0 && (
            <RosterEmptyRow
              colSpan={allDates.length + 1}
              message="No employees match the current filters"
            />
          )}

          {filteredUsers.map((user) => (
            <MonthlyRosterRow
              key={user.userId}
              user={user}
              dates={allDates}
              weekendFlags={weekendFlags}
              todayStr={todayStr}
              detailedView={detailedView}
              highlightShift={highlightShift}
              onOpenDetail={handleOpenDetail}
            />
          ))}

          {filteredUsers.length > 0 && (
            <CoverageSummaryRow
              coverage={dailyCoverage}
              dates={allDates}
              totalUsers={filteredUsers.length}
            />
          )}
        </TableBody>
      </RosterTableFrame>

      {/* Legend (interactive: click a chip to highlight that shift) */}
      <ShiftLegend
        visibleCodes={usedShiftKeys}
        highlightShift={highlightShift}
        onToggleHighlight={handleToggleHighlight}
      />

      {/* Detail dialog */}
      <ShiftDetailDialog
        data={selectedShiftModal}
        onClose={() => setSelectedShiftModal(null)}
      />
    </Box>
  );
};
