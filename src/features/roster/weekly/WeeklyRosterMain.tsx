import { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  TableHead,
  TableRow,
  TableBody,
  Alert,
  Snackbar,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import {
  useGetRosterViewQuery,
  useChangeShiftMutation,
  useGetShiftDropdownQuery,
  useShiftSwapByManagerMutation,
  useShiftSwapRequestByTeamMemberMutation,
} from "../api/rosterApiSlice";
import { useAuth } from "../../auth/hooks/useAuth";
import { toast } from "react-toastify";
import { RosterToolbar } from "../components/RosterToolbar";
import { RosterTableFrame } from "../components/table/RosterTableFrame";
import { RosterDayHeaderCell } from "../components/table/RosterDayHeaderCell";
import { RosterEmployeeHeaderCell } from "../components/table/RosterEmployeeHeaderCell";
import {
  RosterErrorRow,
  RosterEmptyRow,
  SelectFilterPlaceholder,
} from "../components/table/RosterTableStates";
import { ShiftLegend } from "../components/ShiftLegend";
import { EditRosterDialog } from "../components/dialog/EditRosterDialog";
import { ShiftInfoDialog } from "../components/dialog/ShiftInfoDialog";
import { SwapRosterDialog } from "../components/dialog/SwapRosterDialog";
import { WeeklyRosterRow } from "./WeeklyRosterRow";
import { filterRosterUsers } from "../utils/rosterFilter.utils";

/* ─── Types ─── */
interface SwapCell {
  userId: string;
  date: string;
  shiftId: number;
  jobLevel: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export const WeeklyRosterMain = ({
  domainId,
  subDomainId,
  startDate,
  endDate,
}: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  /* ── View state ───────────────────────────────────────────────────── */
  const [isDetailed, setIsDetailed] = useState(true);

  /* ── Dialog state ─────────────────────────────────────────────────── */
  const [editDialogConfig, setEditDialogConfig] = useState<{
    isOpen: boolean;
    data: { shift: any; date: string; userId: string } | null;
  }>({ isOpen: false, data: null });

  const [infoDialogConfig, setInfoDialogConfig] = useState<{
    isOpen: boolean;
    data: { shift: any; date: string; user: any } | null;
  }>({ isOpen: false, data: null });

  const [swapDialogConfig, setSwapDialogConfig] = useState<{
    isOpen: boolean;
    data: {
      cell1: {
        userId: string;
        date: string;
        shiftId: number;
        shiftDisplay: string;
      };
      cell2: {
        userId: string;
        date: string;
        shiftId: number;
        shiftDisplay: string;
      };
    } | null;
  }>({ isOpen: false, data: null });

  /* ── Swap state ───────────────────────────────────────────────────── */
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [selectedSwapCells, setSelectedSwapCells] = useState<SwapCell[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  /* ── Search / filter / highlight state ───────────────────────────── */
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [filterShift, setFilterShift] = useState<string[]>([]);
  const [filterLevel, setFilterLevel] = useState<string[]>([]);
  const [highlightShift, setHighlightShift] = useState("");

  /* ── API ──────────────────────────────────────────────────────────── */
  const shouldSkip = subDomainId == null;

  const { data, error, isLoading, isFetching, refetch } = useGetRosterViewQuery(
    {
      domainId: domainId ?? 0,
      subDomainId: subDomainId ?? 0,
      startDate,
      endDate,
    },
    { skip: shouldSkip },
  );

  const { data: shiftOptions = [] } = useGetShiftDropdownQuery(
    { subDomainId: subDomainId ?? 0 },
    { skip: subDomainId == null },
  );

  /* ── Dates ────────────────────────────────────────────────────────── */
  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        dayjs(startDate).add(i, "day").format("YYYY-MM-DD"),
      ),
    [startDate],
  );

  const weekendFlags = useMemo(
    () => weekDates.map((d) => [0, 6].includes(dayjs(d).day())),
    [weekDates],
  );

  const todayStr = dayjs().format("YYYY-MM-DD");

  /* ── Derived data ─────────────────────────────────────────────────── */
  const allUsers: any[] = useMemo(() => data?.data ?? [], [data]);

  const jobLevels = useMemo(
    () =>
      Array.from(
        new Set(allUsers.map((u: any) => u.jobLevel as string)),
      ).sort(),
    [allUsers],
  );

  const users = useMemo(
    () =>
      filterRosterUsers(allUsers, {
        searchTerms,
        filterLevel,
        filterShift,
        dates: weekDates,
      }),
    [allUsers, searchTerms, filterLevel, filterShift, weekDates],
  );

  /** Per-user swap-selected dates, so only the affected rows re-render
   *  when a swap cell is picked. */
  const swapSelectionByUser = useMemo(() => {
    const map = new Map<string, string[]>();
    selectedSwapCells.forEach((c) => {
      const existing = map.get(String(c.userId));
      if (existing) existing.push(c.date);
      else map.set(String(c.userId), [c.date]);
    });
    return map;
  }, [selectedSwapCells]);

  /* ── Mutations ────────────────────────────────────────────────────── */
  const [changeShift, { isLoading: isChanging }] = useChangeShiftMutation();
  const [swapByManager] = useShiftSwapByManagerMutation();
  const [requestByMember] = useShiftSwapRequestByTeamMemberMutation();

  const { role, userId } = useAuth();

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const getShiftId = useCallback(
    (shiftDisplay: string) => {
      const option = shiftOptions.find(
        (opt) => opt.shiftRange === shiftDisplay,
      );
      return option?.shiftId || 0;
    },
    [shiftOptions],
  );

  /* ── Swap execute ─────────────────────────────────────────────────── */
  const executeSwap = async (
    cell1: {
      userId: string;
      date: string;
      shiftId: number;
      shiftDisplay: string;
    },
    cell2: {
      userId: string;
      date: string;
      shiftId: number;
      shiftDisplay: string;
    },
    reason: string,
  ): Promise<void> => {
    setToastMsg(null);
    setIsSwapping(true);
    try {
      let resp;
      if (
        [
          "SUPER_ADMIN",
          "DOMAIN_HEAD",
          "FUNCTION_HEAD",
          "SUB_DOMAIN_HEAD",
        ].includes(role as string)
      ) {
        resp = await swapByManager({
          affectedUserId1: cell1.userId,
          shiftDate1: cell1.date,
          affectedUserId2: cell2.userId,
          shiftDate2: cell2.date,
          shiftSwapReason: reason,
        }).unwrap();
      } else if (role === "TEAM_MEMBER") {
        const loggedInUserId = String(userId);
        const isCell1LoggedInUser = String(cell1.userId) === loggedInUserId;
        const loggedInUserCell = isCell1LoggedInUser ? cell1 : cell2;
        const otherUserCell = isCell1LoggedInUser ? cell2 : cell1;
        resp = await requestByMember({
          shiftDate1: loggedInUserCell.date,
          recipientUserId: otherUserCell.userId,
          shiftDate2: otherUserCell.date,
          shiftSwapReason: reason,
        }).unwrap();
      }
      if (resp?.message) {
        setToastMsg(resp.message);
        toast.success(resp.message);
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Shift swap failed";
      setToastMsg(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  };

  /* ── Dialog handlers ──────────────────────────────────────────────── */
  const handleOpenEdit = useCallback(
    (shift: any, date: string, userId: string) =>
      setEditDialogConfig({ isOpen: true, data: { shift, date, userId } }),
    [],
  );

  const handleOpenInfo = useCallback(
    (shift: any, date: string, user: any) =>
      setInfoDialogConfig({ isOpen: true, data: { shift, date, user } }),
    [],
  );

  const handleCloseEdit = () =>
    setEditDialogConfig({ isOpen: false, data: null });
  const handleCloseInfo = () =>
    setInfoDialogConfig({ isOpen: false, data: null });
  const handleCloseSwap = () =>
    setSwapDialogConfig({ isOpen: false, data: null });

  /* ── Cell click handler ───────────────────────────────────────────── */
  // Selection is read through a ref so the callback identity stays stable
  // and unchanged rows keep their memoized render.
  const selectedSwapCellsRef = useRef(selectedSwapCells);
  selectedSwapCellsRef.current = selectedSwapCells;

  const handleCellClick = useCallback(
    (shift: any, date: string, user: any) => {
      if (!isSwapMode) {
        handleOpenEdit(shift, date, user.userId);
        return;
      }
      const isFuture = dayjs(date)
        .startOf("day")
        .isAfter(dayjs().startOf("day"));
      if (!isFuture) {
        const msg = "Only future dates can be selected for a shift swap.";
        setToastMsg(msg);
        toast.warning(msg);
        return;
      }
      const current = selectedSwapCellsRef.current;
      const alreadySelectedIndex = current.findIndex(
        (c) => c.userId === user.userId && c.date === date,
      );
      if (alreadySelectedIndex >= 0) {
        setSelectedSwapCells((prev) =>
          prev.filter((_, i) => i !== alreadySelectedIndex),
        );
        return;
      }
      if (current.length >= 2) {
        setToastMsg("You can only select a maximum of two shifts to swap.");
        return;
      }
      if (current.length === 1 && current[0].jobLevel !== user.jobLevel) {
        setToastMsg(
          "Shift swap is only allowed between employees of the same level.",
        );
        return;
      }
      setSelectedSwapCells((prev) => [
        ...prev,
        {
          userId: user.userId,
          date,
          shiftId: getShiftId(shift?.shiftDisplay || ""),
          jobLevel: user.jobLevel,
        },
      ]);
    },
    [isSwapMode, getShiftId, handleOpenEdit],
  );

  /* ── Apply swap ───────────────────────────────────────────────────── */
  const handleApplySwap = async () => {
    if (selectedSwapCells.length !== 2) return;
    const [cell1, cell2] = selectedSwapCells;
    setSwapDialogConfig({
      isOpen: true,
      data: {
        cell1: {
          userId: cell1.userId,
          date: cell1.date,
          shiftId: cell1.shiftId,
          shiftDisplay:
            shiftOptions.find((opt) => opt.shiftId === cell1.shiftId)
              ?.shiftRange || "Unknown",
        },
        cell2: {
          userId: cell2.userId,
          date: cell2.date,
          shiftId: cell2.shiftId,
          shiftDisplay:
            shiftOptions.find((opt) => opt.shiftId === cell2.shiftId)
              ?.shiftRange || "Unknown",
        },
      },
    });
  };

  /* ── Save shift ───────────────────────────────────────────────────── */
  const handleSaveShift = async (
    userId: string,
    date: string,
    newShiftId: number,
    newAssignActivity: number,
    newAvailableMinutes: number,
    reason: string,
  ) => {
    setToastMsg(null);

    try {
      const response = await changeShift({
        affectedUserId: Number(userId),
        shiftDate: date, // YYYY-MM-DD
        newShiftId: Number(newShiftId),
        newAssignActivity: Number(newAssignActivity),
        newAvailableMinutes: Number(newAvailableMinutes),
        reason: reason.trim(),
      }).unwrap();

      handleCloseEdit();

      const successMessage = response?.message || "Shift changed successfully";

      setToastMsg(successMessage);
      toast.success(successMessage);
    } catch (error: any) {
      console.error("Change Shift Error:", error);

      const errorMessage =
        error?.data?.message || error?.message || "Shift change failed";

      setToastMsg(errorMessage);
      toast.error(errorMessage);
    }
  };

  const hasError = data?.success === false || !!error;
  const errorMessage = "Roster not generated for selected range";

  /* ── Guard ────────────────────────────────────────────────────────── */
  if (shouldSkip) {
    return <SelectFilterPlaceholder />;
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Box
      bgcolor={isDark ? theme.palette.background.default : "#F9FAFB"}
      height="80vh"
      position="relative"
    >
      {/* Toolbar */}
      <RosterToolbar
        domainId={domainId}
        subDomainId={subDomainId}
        searchTerms={searchTerms}
        onSearchChange={setSearchTerms}
        isDetailed={isDetailed}
        onToggleDetailed={() => setIsDetailed((p) => !p)}
        filterShift={filterShift}
        onFilterShiftChange={setFilterShift}
        filterLevel={filterLevel}
        onFilterLevelChange={setFilterLevel}
        jobLevels={jobLevels}
        highlightShift={highlightShift}
        onHighlightShiftChange={setHighlightShift}
        searchInputId="weekly-roster-search-input"
        swap={{
          isSwapMode,
          onToggleSwapMode: () => {
            setIsSwapMode((p) => !p);
            setSelectedSwapCells([]);
          },
          selectedSwapCount: selectedSwapCells.length,
          onApplySwap: handleApplySwap,
          isSwapping,
        }}
      />

      <SwapRosterDialog
        open={swapDialogConfig.isOpen}
        onClose={handleCloseSwap}
        swapData={swapDialogConfig.data}
        onConfirm={executeSwap}
        onSwapSuccess={() => {
          setToastMsg("Shifts swapped successfully!");
          setIsSwapMode(false);
          setSelectedSwapCells([]);
          refetch();
        }}
      />

      {isSwapMode && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Swap Mode Active: Select two shifts of future dates and same level to
          swap. ({selectedSwapCells.length}/2 selected)
        </Alert>
      )}

      {/* Table */}
      <RosterTableFrame height={450} loading={isFetching}>
        {/* ── Head ─────────────────────────────────────────────── */}
        <TableHead>
          <TableRow>
            <RosterEmployeeHeaderCell
              count={!hasError && !isLoading ? users.length : undefined}
            />
            {weekDates.map((date, i) => (
              <RosterDayHeaderCell
                key={date}
                date={date}
                isToday={date === todayStr}
                isWeekend={weekendFlags[i]}
                minWidth={isDetailed ? 148 : 56}
                width={isDetailed ? 148 : 56}
              />
            ))}
          </TableRow>
        </TableHead>

        {/* ── Body ─────────────────────────────────────────────── */}
        <TableBody>
          {hasError ? (
            <RosterErrorRow
              colSpan={weekDates.length + 1}
              message={errorMessage}
            />
          ) : users.length === 0 ? (
            <RosterEmptyRow
              colSpan={weekDates.length + 1}
              message={
                allUsers.length > 0
                  ? "No employees match the current filters"
                  : "No roster available."
              }
            />
          ) : (
            users.map((user: any) => (
              <WeeklyRosterRow
                key={user.userId}
                user={user}
                weekDates={weekDates}
                isDetailed={isDetailed}
                isSwapMode={isSwapMode}
                highlightShift={highlightShift}
                selectedDates={swapSelectionByUser.get(String(user.userId))}
                onCellClick={handleCellClick}
                onInfoClick={handleOpenInfo}
              />
            ))
          )}
        </TableBody>
      </RosterTableFrame>

      <ShiftLegend
        visibleCodes={["G", "LG", "B", "N", "A", "L", "H", "C", "W"]}
      />

      {/* Dialogs */}
      <EditRosterDialog
        open={editDialogConfig.isOpen}
        onClose={handleCloseEdit}
        editData={editDialogConfig.data}
        onSave={handleSaveShift}
        saving={isChanging}
        shiftOptions={shiftOptions}
      />
      <ShiftInfoDialog
        open={infoDialogConfig.isOpen}
        onClose={handleCloseInfo}
        data={infoDialogConfig.data}
      />
      <Snackbar
        open={!!toastMsg}
        autoHideDuration={4000}
        onClose={() => setToastMsg(null)}
        message={toastMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
