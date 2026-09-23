import { api } from "../../../service/api";
import type {
  AttendanceRow,
  EmpWorkLocationRow,
  EmployeeOnLeaveRow,
  EngineerDailyAssignmentRow,
  UpcomingHolidayRow,
  WorkMode,
} from "../types/dashboard.types";

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUpcomingHolidays: builder.query<UpcomingHolidayRow[], void>({
      query: () => "/dashboard/upcomingholidays",
    }),
    getEmployeesOnLeave: builder.query<EmployeeOnLeaveRow[], void>({
      query: () => "/dashboard/employeesonleave",
    }),
    getDailyAssignments: builder.query<
      EngineerDailyAssignmentRow[],
      { date: string; userId?: number | string }
    >({
      query: ({ date, userId }) => ({
        url: `/dashboard/dailyassignments`,
        params: userId != null ? { date, userId } : { date },
      }),
    }),
    getWorkLocation: builder.query<EmpWorkLocationRow[], { date: string }>({
      query: ({ date }) => ({
        url: `/dashboard/worklocation`,
        params: { date },
      }),
    }),
    getTodayAttendance: builder.query<AttendanceRow | null, void>({
      query: () => "/attendance/today",
      providesTags: ["Attendance"],
    }),
    setWorkMode: builder.mutation<AttendanceRow, WorkMode>({
      query: (workMode) => ({
        url: "/attendance/workmode",
        method: "POST",
        body: { workMode },
      }),
      invalidatesTags: ["Attendance"],
    }),
    clockIn: builder.mutation<AttendanceRow, WorkMode | undefined>({
      query: (workMode) => ({
        url: "/attendance/clockin",
        method: "POST",
        body: workMode ? { workMode } : {},
      }),
      invalidatesTags: ["Attendance"],
    }),
    clockOut: builder.mutation<AttendanceRow, void>({
      query: () => ({ url: "/attendance/clockout", method: "POST" }),
      invalidatesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetUpcomingHolidaysQuery,
  useGetEmployeesOnLeaveQuery,
  useGetDailyAssignmentsQuery,
  useGetWorkLocationQuery,
  useGetTodayAttendanceQuery,
  useSetWorkModeMutation,
  useClockInMutation,
  useClockOutMutation,
} = dashboardApi;
