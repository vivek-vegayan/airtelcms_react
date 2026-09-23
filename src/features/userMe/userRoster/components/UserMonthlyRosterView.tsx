import { useCallback, useMemo, useState, type ComponentType } from "react";
import {
  Calendar,
  momentLocalizer,
  Views,
  type CalendarProps,
  type Components,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";

// Styles
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// MUI Components
import {
  Alert,
  Box,
  LinearProgress,
  Paper,
  Snackbar,
  useTheme,
} from "@mui/material";

// Components & Utils
import EventCell from "./EventCell";
import CustomToolbar from "./CustomToolbar";
import RosterLegend from "./RosterLegend";
import RosterStatsStrip from "./RosterStatsStrip";
import ShiftDetailDialog from "./ShiftDetailDialog";
import { MonthDateHeader } from "./MonthDayCell";
import { TimeGutterHeader, TimeViewHeader } from "./CalendarHeaders";
import {
  CalendarEmptyOverlay,
  CalendarSkeleton,
  RosterErrorNotice,
} from "./CalendarStates";
import {
  RosterCalendarContext,
  toDateKey,
  type RosterCalendarValue,
} from "../context/RosterCalendarContext";
import { useCalendarTokens } from "../constants/calendarTokens";
import { getShiftVisual } from "../constants/shiftColors";
import { DAY_CLASS, buildCalendarSx } from "../styles/calendarSx";
import { useUserRosterMonth } from "../hooks/useUserRosterMonth";
import type { CalendarEvent, ToastState } from "../types/roster.types";

const localizer = momentLocalizer(moment);

// react-big-calendar's `Calendar` is a generic class component; the DnD HOC's
// typings can't infer a custom TEvent through it directly, so this asserts
// the shape it actually has once instantiated with CalendarEvent.
const DnDCalendar = withDragAndDrop<CalendarEvent>(
  Calendar as unknown as ComponentType<CalendarProps<CalendarEvent, object>>,
);

// Module-level: rbc memoises `components` by identity, so rebuilding this
// object every render would remount the entire grid. The cell renderers read
// their per-day data from RosterCalendarContext instead of from props.
const CALENDAR_COMPONENTS: Components<CalendarEvent, object> = {
  event: EventCell,
  timeGutterHeader: TimeGutterHeader,
  month: { dateHeader: MonthDateHeader },
  week: { header: TimeViewHeader },
  day: { header: TimeViewHeader },
};

const CALENDAR_VIEWS = [Views.MONTH, Views.WEEK, Views.DAY];

// "12:00 AM" in every gutter row is noise at this density; the hour alone
// reads faster and lets the gutter stay narrow.
const CALENDAR_FORMATS = { timeGutterFormat: "h A" };

/** Where Week/Day open their scroll — the start of the working day rather
 *  than midnight, which is what made the time views land on seven empty
 *  hours. Night shifts still exist above and below; this is only the
 *  initial scroll offset, not a clamp on the range. */
const SCROLL_TO_TIME = new Date(1970, 0, 1, 7, 0, 0);

type RosterView = "month" | "week" | "day";

interface DetailTarget {
  date: Date;
  dateKey: string;
  event: CalendarEvent | null;
}

/** Horizontal rhythm copied from CommonContainer so this page lines up with
 *  its sibling tabs — but without CommonContainer's fixed height + `overflow:
 *  auto`, which stacked a second scroller inside the shell's own. The shell
 *  is now the single scroll owner. */
const PAGE_PADDING = {
  xs: "0px 8px 12px",
  sm: "4px 12px 14px",
  md: "4px 18px 16px",
  lg: "4px 40px 16px",
  xl: "8px 16px 18px",
};

const UserMonthlyRosterView = () => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<RosterView>(Views.MONTH as RosterView);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const { events, dayMeta, stats, status, errorMessage, isRefreshing, refetch } =
    useUserRosterMonth(currentDate);

  // Drag & drop edits a local copy of the events. Synced from the query
  // during render rather than in an Effect — avoids the extra render pass
  // setState-in-effect causes. `events` is memoised on the roster payload,
  // so this only re-runs when the data actually changes.
  const [lastEvents, setLastEvents] = useState(events);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(events);
  if (events !== lastEvents) {
    setLastEvents(events);
    setLocalEvents(events);
  }

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const periodLabel = useMemo(() => {
    if (view === "month") return moment(currentDate).format("MMMM YYYY");
    if (view === "week") {
      const start = moment(currentDate).startOf("week");
      const end = moment(currentDate).endOf("week");
      return `${start.format("DD MMM")} – ${end.format("DD MMM YYYY")}`;
    }
    return moment(currentDate).format("dddd, DD MMM YYYY");
  }, [currentDate, view]);

  /* ── Handlers ───────────────────────────────────────────────────────── */

  const handleNavigate = useCallback(
    (action: "PREV" | "NEXT" | "TODAY") => {
      if (action === "TODAY") {
        setCurrentDate(new Date());
        return;
      }
      const unit = view === "month" ? "month" : view === "week" ? "week" : "day";
      setCurrentDate((prev) =>
        action === "PREV"
          ? moment(prev).subtract(1, unit).toDate()
          : moment(prev).add(1, unit).toDate(),
      );
    },
    [view],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setDetail({
      date: event.start,
      dateKey: event.resource?.dateKey ?? toDateKey(event.start),
      event,
    });
  }, []);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // Unchanged product rule: past dates are not selectable.
    if (moment(slotInfo.start).isBefore(moment(), "day")) {
      setToast({ message: "Cannot select past dates.", severity: "warning" });
      return;
    }
    // The selection is now visible in the grid, so the old
    // "Date Selected: …" toast would just be redundant noise.
    setSelectedKey(toDateKey(slotInfo.start));
  }, []);

  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      setLocalEvents((prev) => {
        const existing = prev.find((ev) => ev.id === event.id);
        if (existing) {
          return prev.map((ev) =>
            ev.id === event.id
              ? { ...ev, start: new Date(start), end: new Date(end) }
              : ev,
          );
        }
        return prev;
      });
      setToast({ message: "Event updated successfully!", severity: "success" });
    },
    [],
  );

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const v = getShiftVisual(event.resource?.code ?? event.title, t.isDark);
      return {
        style: {
          backgroundColor: v.bg,
          color: v.fg,
          border: `1px solid ${v.border}`,
          borderLeft: `3px solid ${v.accent}`,
          borderRadius: `${t.radiusSm}px`,
          padding: "1px 4px",
          minHeight: 18,
          fontSize: 11,
          fontWeight: 600,
          boxShadow: "none",
        },
      };
    },
    [t.isDark, t.radiusSm],
  );

  /**
   * One source of truth for day states across all three views. rbc applies
   * this to the Month background cell, the Week/Day column *and* the
   * time-view column heading, so Week and Day now carry the same
   * weekend/holiday/today/selected language the Month grid does.
   */
  const dayPropGetter = useCallback(
    (date: Date) => {
      const key = toDateKey(date);
      const weekday = date.getDay();
      const classes: string[] = [];

      if (weekday === 0 || weekday === 6) classes.push(DAY_CLASS.weekend);
      if (dayMeta.get(key)?.isHoliday) classes.push(DAY_CLASS.holiday);
      if (key === todayKey) classes.push(DAY_CLASS.today);
      if (key === selectedKey) classes.push(DAY_CLASS.selected);

      return classes.length ? { className: classes.join(" ") } : {};
    },
    [dayMeta, todayKey, selectedKey],
  );

  /* ── Derived render state ───────────────────────────────────────────── */

  const calendarSx = useMemo(() => buildCalendarSx(t, theme), [t, theme]);

  const contextValue = useMemo<RosterCalendarValue>(
    () => ({ dayMeta, selectedKey, todayKey, tokens: t }),
    [dayMeta, selectedKey, todayKey, t],
  );

  const detailMeta = detail ? (dayMeta.get(detail.dateKey) ?? null) : null;
  const isCold = status === "loading";
  const showStats = status === "ready";

  return (
    <Box
      sx={{
        // Fills the routed content region (AnimatedOutlet is a flex column)
        // so the page paints the full shell instead of floating as a short
        // box on the tab's tinted background.
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        // No height cap and no `overflow` here on purpose: the page shell
        // above owns the only scrollbar.
        p: PAGE_PADDING,
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
          overflow: "hidden",
          borderRadius: `${t.radius + 4}px`,
          border: `1px solid ${t.grid}`,
          bgcolor: t.surface,
          boxShadow: t.shadowCard,
          p: { xs: 1.25, sm: 1.75, md: 2 },
          // Fills the viewport on a real screen, falls back to natural
          // height on small ones where the page scrolls anyway.
          //
          // Deliberately a viewport calc rather than `flex: 1`: it is always
          // a definite length, so the grid can never collapse to zero height
          // if the flex chain above changes. And being pure CSS there is no
          // measure → resize → re-measure loop at boundary window sizes.
          // The 116px subtracts the shell chrome above (tab strip + padding).
          height: {
            xs: "auto",
            md: "clamp(520px, calc(100vh - 116px), 1040px)",
          },
        }}
      >
        {/* Background refresh: 2px, absolutely positioned, so month-to-month
            navigation never shifts the layout or blocks the grid. */}
        {isRefreshing && (
          <LinearProgress
            aria-label="Refreshing roster"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              borderRadius: 0,
              bgcolor: "transparent",
              "& .MuiLinearProgress-bar": { bgcolor: t.accent },
            }}
          />
        )}

        <CustomToolbar
          date={currentDate}
          label={periodLabel}
          currentView={view}
          onNavigate={handleNavigate}
          onView={setView}
          onRefresh={refetch}
          isRefreshing={isRefreshing}
        />

        {status === "error" && errorMessage && (
          <RosterErrorNotice
            message={errorMessage}
            onRetry={refetch}
            isRetrying={isRefreshing}
          />
        )}

        {showStats && <RosterStatsStrip stats={stats} />}

        <Box
          sx={{
            // Vendor overrides first, layout second: the layout below owns
            // this box's own size and must not be merged away.
            ...calendarSx,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            flex: { md: 1 },
            // Definite height on phones/tablets (the Paper is auto there);
            // the flex remainder on desktop.
            height: { xs: 460, sm: 540, md: "auto" },
            opacity: isRefreshing ? 0.72 : 1,
            transition: "opacity .18s ease",
          }}
        >
          {isCold ? (
            <CalendarSkeleton />
          ) : (
            <RosterCalendarContext.Provider value={contextValue}>
              <DnDCalendar
                localizer={localizer}
                events={localEvents}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                onNavigate={setCurrentDate}
                onView={(nextView: View) => setView(nextView as RosterView)}
                view={view}
                views={CALENDAR_VIEWS}
                toolbar={false}
                popup
                selectable
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                onEventDrop={handleEventDrop}
                resizable={false}
                eventPropGetter={eventStyleGetter}
                dayPropGetter={dayPropGetter}
                dayLayoutAlgorithm="no-overlap"
                scrollToTime={SCROLL_TO_TIME}
                formats={CALENDAR_FORMATS}
                components={CALENDAR_COMPONENTS}
              />

              {status === "empty" && <CalendarEmptyOverlay />}
            </RosterCalendarContext.Provider>
          )}
        </Box>

        <RosterLegend />
      </Paper>

      <ShiftDetailDialog
        open={!!detail}
        onClose={() => setDetail(null)}
        date={detail?.date ?? null}
        meta={detailMeta}
        event={detail?.event ?? null}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default UserMonthlyRosterView;
