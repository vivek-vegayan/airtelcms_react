import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../style/theme";
import { RescheduleNotificationPage } from "../../rescheduleNotification";
import { useDashboardRoster } from "../hooks/useDashboardRoster";
import { useDashboardProfile } from "../hooks/useDashboardProfile";
import { useDashboardHolidays } from "../hooks/useDashboardHolidays";
import { useDashboardLeaveTeam } from "../hooks/useDashboardLeaveTeam";
import { useDashboardAssignments } from "../hooks/useDashboardAssignments";
import { useDashboardAttendance } from "../hooks/useDashboardAttendance";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { ProfileCard } from "../components/ProfileCard";
import { AttendanceCard } from "../components/AttendanceCard";
import { UpcomingHolidaysCard } from "../components/UpcomingHolidaysCard";
import { TodaysAssignmentsCard } from "../components/TodaysAssignmentsCard";
import { StatCardsGrid } from "../components/StatCardsGrid";
import { WeeklyScheduleCard } from "../components/WeeklyScheduleCard";
import { OnLeaveTodayCard } from "../components/OnLeaveTodayCard";
import { usePageLoading } from "../../../components/loading/LoadingProvider";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import {
  DASHBOARD_CONTENT_TOP_COLUMNS,
  DASHBOARD_GRID_GAP,
  DASHBOARD_MAIN_COLUMNS,
  DASHBOARD_PAGE_PADDING,
} from "../constants/dashboard.styles";

export default function ModernHomeDashboard() {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const roster = useDashboardRoster();
  const { profile, status: profileStatus, errorMessage: profileErrorMessage } = useDashboardProfile();
  const holidays = useDashboardHolidays();
  const leaveTeam = useDashboardLeaveTeam();
  const assignments = useDashboardAssignments();
  const attendance = useDashboardAttendance();
  const statCards = useDashboardStats();

  // Page Loader covers only the *first* load of this page's 7 parallel
  // queries; once every widget has settled once (ready/empty/error), this
  // flips permanently false so later background refetch never re-trigger
  // it — each card then relies on its own (now refetch-safe) status.
  const hasLoadedOnceRef = useRef(false);
  const anyStillLoading = [
    roster.status,
    profileStatus,
    holidays.status,
    leaveTeam.status,
    assignments.status,
    attendance.status,
  ].some((s) => s === "loading");
  useEffect(() => {
    if (!anyStillLoading) hasLoadedOnceRef.current = true;
  }, [anyStillLoading]);
  const isInitialLoading = anyStillLoading && !hasLoadedOnceRef.current;
  usePageLoading(isInitialLoading, "home-dashboard");

  // A layout-shaped skeleton rather than a centred spinner: the widgets fade
  // into the exact slots their placeholders occupied, with no half-height
  // spinner box in between. (`usePageLoading` above still holds the boot
  // splash over this on the very first load.)
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <Box
      sx={{
        // Absorbs the 16px the retired Home shell used to add around this
        // page (pl/pr: 2). The merged shell pads nothing, so the Overview tab
        // keeps the exact gutters it had before the restructure.
        p: DASHBOARD_PAGE_PADDING,
        // The shell already hides horizontal overflow; this keeps any widget
        // that outgrows its track (long CRQ ids, the 7-day strip) contained
        // rather than silently clipped by an ancestor.
        maxWidth: "100%",
        overflowX: "hidden",
        fontFamily: (theme) => theme.typography.fontFamily,
      }}
    >
      {/* ══ Main grid — left rail + fluid content column ══ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: DASHBOARD_MAIN_COLUMNS,
          gap: DASHBOARD_GRID_GAP,
          alignItems: "start",
        }}
      >
        {/* ── LEFT — Profile, Work location, Holidays, On leave ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: DASHBOARD_GRID_GAP, minWidth: 0 }}>
          <ProfileCard
            status={profileStatus}
            profile={profile}
            errorMessage={profileErrorMessage}
            stats={{
              doneCount: assignments.doneCount,
              totalTasks: assignments.totalCount,
              progressPct: assignments.totalCount > 0 ? (assignments.doneCount / assignments.totalCount) * 100 : 0,
              wfMode: attendance.attendance?.workfromLocation ?? "—",
            }}
            colors={colors}
            mounted={mounted}
            delay={0.05}
          />

          <AttendanceCard
            attendance={attendance.attendance}
            status={attendance.status}
            errorMessage={attendance.errorMessage}
            isMutating={attendance.isMutating}
            onSetWorkMode={attendance.setWorkMode}
            onClockIn={attendance.clockIn}
            onClockOut={attendance.clockOut}
            colors={colors}
            mounted={mounted}
            delay={0.1}
          />

          {/* <UpcomingHolidaysCard
            holidays={holidays.holidays}
            status={holidays.status}
            errorMessage={holidays.errorMessage}
            colors={colors}
            mounted={mounted}
            delay={0.15}
          /> */}

          {/* <OnLeaveTodayCard
            team={leaveTeam.team}
            status={leaveTeam.status}
            errorMessage={leaveTeam.errorMessage}
            colors={colors}
            mounted={mounted}
            delay={0.2}
          /> */}
        </Box>

        {/* ── RIGHT — Assignments + stats (equal height), schedule, notifications ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: DASHBOARD_GRID_GAP, minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: DASHBOARD_CONTENT_TOP_COLUMNS,
              gap: DASHBOARD_GRID_GAP,
              alignItems: "stretch",
            }}
          >
            <TodaysAssignmentsCard
              assignments={assignments.assignments}
              doneCount={assignments.doneCount}
              totalCount={assignments.totalCount}
              status={assignments.status}
              errorMessage={assignments.errorMessage}
              colors={colors}
              mounted={mounted}
              delay={0.08}
            />

            <StatCardsGrid cards={statCards} colors={colors} mounted={mounted} delay={0.12} />
          </Box>
          {/* <RescheduleNotificationPage /> */}

          <WeeklyScheduleCard
            week={roster.days}
            rangeLabel={roster.rangeLabel}
            status={roster.status}
            errorMessage={roster.errorMessage}
            anchorDate={roster.anchorDate}
            colors={colors}
            mounted={mounted}
            delay={0.16}
            onPrev={roster.goPrev}
            onNext={roster.goNext}
            onToday={roster.goToday}
          />
        </Box>
      </Box>
    </Box>
  );
}
