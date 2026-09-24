import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { errMsg } from "../../cabManager/components/shared/errMsg";
import {
  useGetReassignTimelineQuery,
  useReassignTimeMutation,
} from "../api/crqReassignApi";
import {
  addDays,
  datesBetween,
  longDate,
  parseYmd,
  toSqlDateTime,
  ymd,
} from "../utils/crqReassign.utils";
import { buildEngineers, type TimeBlock } from "../utils/timelineModel";
import DateGridView from "./DateGridView";
import DayHourView from "./DayHourView";
import TimeChangeDialog, { type TimeTarget } from "./TimeChangeDialog";
import { useReassignTokens } from "../hooks/useReassignTokens";
import { HintBar, type Note } from "./reassignUi";

export type TimeLevel = "week" | "month" | "day";

interface Props {
  level: TimeLevel;
  /** Level to return to from the day view. */
  gridLevel: "week" | "month";
  from: string;
  to: string;
  anchor: string;
  teamId?: number;
  engLevel: string;
  shift: string;
  search: string;
  batchId: string | null;
  note: Note | null;
  setNote: (note: Note | null) => void;
  onBatch: (batchId: string | null) => void;
  onLevel: (level: TimeLevel) => void;
  onOpenDate: (date: string) => void;
}

/** Time slot view over CRQ_SP_REASSIGN_TIMELINE: week / month overview and the hourly day view. */
export const TimelineView = (p: Props) => {
  const { tk, rule } = useReassignTokens();
  const [target, setTarget] = useState<TimeTarget | null>(null);

  // One day back so an overnight activity started the day before shows as CONT.
  const fetchFrom = ymd(addDays(parseYmd(p.from), -1));
  const {
    data: rows = [],
    isFetching,
    error,
  } = useGetReassignTimelineQuery({
    from: fetchFrom,
    to: p.to,
    teamId: p.teamId,
    level: p.engLevel,
    shift: p.shift,
    search: p.search || undefined,
  });
  const [reassignTime, { isLoading: moving }] = useReassignTimeMutation();

  const engineers = useMemo(
    () => buildEngineers(rows, p.from, p.to),
    [rows, p.from, p.to],
  );
  const dates = useMemo(() => datesBetween(p.from, p.to), [p.from, p.to]);

  const move = async (block: TimeBlock, newStart: Date) => {
    try {
      const res = await reassignTime({
        crqNo: block.crqNo,
        stage: "EXECUTION",
        newStart: toSqlDateTime(newStart),
        keepDuration: true,
        newEnd: null,
        batchId: p.batchId,
      }).unwrap();
      p.onBatch(res.batchId);
      p.setNote({ text: res.message, bad: false });
    } catch (e) {
      p.setNote({ text: errMsg(e), bad: true });
    }
  };

  return (
    <Box>
      {p.level === "day" ? (
        <HintBar note={p.note}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => p.onLevel(p.gridLevel)}
            sx={{ textTransform: "none", height: 28 }}
          >
            ← {p.gridLevel === "week" ? "Week" : "Month"} view
          </Button>
          <Box component="span" sx={{ fontWeight: 600, color: tk.textPrimary }}>
            {longDate(p.anchor)}
          </Box>
          <Box component="span">
            Drag a CRQ block to a new hour — 24-hour clock. The start must stay
            on this date; an overnight CRQ may end on the next date. Click a
            block to set exact minutes.
          </Box>
        </HintBar>
      ) : (
        <HintBar note={p.note}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={p.level}
            onChange={(_e, v) => v && p.onLevel(v)}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                px: 1.5,
                py: 0.25,
                fontSize: 12,
              },
            }}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
          <Box component="span" sx={{ fontWeight: 600, color: tk.textPrimary }}>
            Click a date column to open its hourly view.
          </Box>
          <Box component="span">Time changes happen inside a single date.</Box>
        </HintBar>
      )}

      {isFetching ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress size={26} />
        </Box>
      ) : error ? (
        <Typography sx={{ p: 5, color: tk.danger, fontSize: 13 }}>
          {errMsg(error)}
        </Typography>
      ) : engineers.length === 0 ? (
        <Typography
          sx={{
            p: 5,
            color: tk.textSecondary,
            fontSize: 13,
            borderBottom: rule,
          }}
        >
          No rostered engineer matches the current filters in this range.
        </Typography>
      ) : (
        // Small scroll box: the grid scrolls up/down inside it, header row stays pinned.
        <Box sx={{ overflowY: "auto", overflowX: "hidden", maxHeight: "calc(100vh - 430px)", minHeight: 280 }}>
          {p.level === "day" ? (
            <DayHourView
              engineers={engineers}
              date={p.anchor}
              busy={moving}
              onMove={move}
              onBlocked={(text) => p.setNote({ text, bad: true })}
              onBlockClick={(b) =>
                setTarget({
                  crqNo: b.crqNo,
                  engineer: b.olmid,
                  blockStart: b.row.block_start,
                  blockEnd: b.row.block_end,
                })
              }
            />
          ) : (
            <DateGridView
              engineers={engineers}
              dates={dates}
              activeDate={p.anchor}
              compact={p.level === "month"}
              onOpenDate={p.onOpenDate}
            />
          )}
        </Box>
      )}

      <TimeChangeDialog
        key={target ? `${target.crqNo}|${target.blockStart}` : "closed"}
        target={target}
        batchId={p.batchId}
        onClose={() => setTarget(null)}
        onBatch={p.onBatch}
      />
    </Box>
  );
};

export default TimelineView;
