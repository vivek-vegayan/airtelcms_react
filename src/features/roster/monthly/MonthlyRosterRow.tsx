import { memo } from "react";
import { TableRow, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { RosterEmployeeCell } from "../components/RosterEmployeeCell";
import { MonthlyShiftCell } from "./MonthlyShiftCell";
import type { ShiftInfo, UserRoster } from "../types/monthlyRoster.type";

interface Props {
  user: UserRoster;
  dates: string[];
  /** Parallel to `dates`: true where the column is a weekend. */
  weekendFlags: boolean[];
  todayStr: string;
  detailedView: boolean;
  highlightShift: string;
  onOpenDetail: (user: UserRoster, date: string, shift?: ShiftInfo) => void;
}

/**
 * One employee row of the Monthly grid. Memoized so opening the detail
 * dialog or other row-independent state changes don't re-render the
 * whole month × employees grid.
 */
export const MonthlyRosterRow = memo(function MonthlyRosterRow({
  user,
  dates,
  weekendFlags,
  todayStr,
  detailedView,
  highlightShift,
  onOpenDetail,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <TableRow
      sx={{
        "&:hover": { bgcolor: isDark ? alpha("#fff", 0.02) : "#FAFAFA" },
        "&:last-child td": { borderBottom: "none" },
      }}
    >
      <RosterEmployeeCell user={user} />

      {dates.map((date, i) => (
        <MonthlyShiftCell
          key={date}
          user={user}
          date={date}
          shift={user.roster?.[date]}
          detailedView={detailedView}
          highlightShift={highlightShift}
          isToday={date === todayStr}
          isWeekend={weekendFlags[i]}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </TableRow>
  );
});
