import { memo } from "react";
import { TableRow } from "@mui/material";
import { RosterEmployeeCell } from "../components/RosterEmployeeCell";
import { RosterShiftCell } from "../components/RosterShiftCell";
import { RosterShiftCellCompact } from "../components/Rostershiftcellcompact";

interface Props {
  user: any;
  weekDates: string[];
  isDetailed: boolean;
  isSwapMode: boolean;
  highlightShift: string;
  /** Dates of this user's cells currently selected for swap (undefined when none). */
  selectedDates?: string[];
  onCellClick: (shift: any, date: string, user: any) => void;
  onInfoClick: (shift: any, date: string, user: any) => void;
}

/**
 * One employee row of the Weekly grid. Memoized so rows whose props are
 * unchanged (all rows except the one being interacted with) skip
 * re-rendering when swap selections, dialogs or toasts update.
 */
export const WeeklyRosterRow = memo(function WeeklyRosterRow({
  user,
  weekDates,
  isDetailed,
  isSwapMode,
  highlightShift,
  selectedDates,
  onCellClick,
  onInfoClick,
}: Props) {
  return (
    <TableRow hover sx={{ "&:last-child td": { borderBottom: "none" } }}>
      <RosterEmployeeCell user={user} />

      {weekDates.map((date) => {
        const isSelectedForSwap = selectedDates?.includes(date) ?? false;

        return isDetailed ? (
          <RosterShiftCell
            key={date}
            shift={user.roster?.[date]}
            shiftDate={date}
            rowUserId={user.userId}
            isSelectedForSwap={isSelectedForSwap}
            isSwapMode={isSwapMode}
            highlightShift={highlightShift}
            onEditClick={(shift) => onCellClick(shift, date, user)}
            onInfoClick={(shift) => onInfoClick(shift, date, user)}
          />
        ) : (
          <RosterShiftCellCompact
            key={date}
            shift={user.roster?.[date]}
            shiftDate={date}
            rowUserId={user.userId}
            isSelectedForSwap={isSelectedForSwap}
            isSwapMode={isSwapMode}
            highlightShift={highlightShift}
            onEditClick={(shift) => onCellClick(shift, date, user)}
          />
        );
      })}
    </TableRow>
  );
});
