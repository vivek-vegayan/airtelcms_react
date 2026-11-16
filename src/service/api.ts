import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";
import type { RootState } from "../app/store";
import { authStorage } from "../app/store/auth.storage";
import { logout, setToken } from "../features/auth/slices/auth.slice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_REACT_APP_BASE_URL,
  // Send the httpOnly `jwt` cookie the backend already issues on login.
  // It can't be read or stolen via JS/XSS (unlike the bearer token), so
  // this gives the API a second, tamper-resistant way to authenticate
  // the request even if the Authorization header is ever missing.
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Endpoints where a 401/403 is an expected outcome of the call itself
// (bad credentials, already logged in elsewhere) rather than a signal
// that a previously-valid session has gone stale. /session/terminate
// answers 401 for a wrong password, which says nothing about the caller's
// own session — they don't have one yet, that's why they're on this page.
const AUTH_LIFECYCLE_PATHS = [
  "/auth/v1/signin",
  "/auth/v1/logout",
  "/auth/v1/session/terminate",
];

// Calls where a 401 must not trigger a token refresh: no session exists yet,
// or the call is the refresh itself.
const NO_REFRESH_PATHS = [
  "/auth/v1/signin",
  "/auth/v1/session/terminate",
  "/auth/v1/refresh",
];

const matchesPath = (args: string | FetchArgs, paths: string[]): boolean => {
  const url = typeof args === "string" ? args : args.url;
  return paths.some((path) => url.includes(path));
};

const isAuthLifecycleRequest = (args: string | FetchArgs): boolean =>
  matchesPath(args, AUTH_LIFECYCLE_PATHS);

// One refresh at a time: when several calls hit 401 together they all wait on
// the same /auth/v1/refresh instead of each firing their own.
let refreshInFlight: Promise<boolean> | null = null;

const refreshAccessToken = (
  queryApi: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<boolean> => {
  refreshInFlight ??= (async () => {
    const res = await rawBaseQuery(
      { url: "/auth/v1/refresh", method: "POST" },
      queryApi,
      extraOptions,
    );
    const token = (res.data as { accessToken?: string } | undefined)
      ?.accessToken;
    if (token) queryApi.dispatch(setToken(token));
    return Boolean(token);
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

// Global session-expiration handler. A 401 first tries to renew the short
// access token from the httpOnly refresh cookie and retries the call once.
// Only if that fails is the session really over on the server (idle timeout,
// 12-hour limit, terminated elsewhere), so clearing it locally leaves no live
// server session behind to trigger "Already Logged" on the next sign-in.
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, queryApi, extraOptions) => {
  let result = await rawBaseQuery(args, queryApi, extraOptions);

  if (
    result.error?.status === 401 &&
    !matchesPath(args, NO_REFRESH_PATHS) &&
    (await refreshAccessToken(queryApi, extraOptions))
  ) {
    result = await rawBaseQuery(args, queryApi, extraOptions);
  }

  if (result.error && !isAuthLifecycleRequest(args)) {
    const status = result.error.status;
    if (status === 401) {
      const wasAuthenticated = (queryApi.getState() as RootState).auth
        .isAuthenticated;
      authStorage.clear();
      queryApi.dispatch(logout());
      // Purge every cached query (attendance, roster, profile, ...) so the
      // next login — same user or different — always refetches fresh data
      // instead of briefly showing this session's stale cache.
      queryApi.dispatch(api.util.resetApiState());
      if (wasAuthenticated) {
        toast.error("Your session has expired. Please sign in again.");
      }
    } else if (status === 403) {
      // Authenticated but not authorized for this specific action — surface
      // the server's message without tearing down an otherwise-valid session.
      const data = result.error.data as { message?: string } | undefined;
      toast.error(data?.message ?? "You don't have permission to do that.");
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "ORG_HIERARCHY",
    "EMPLOYEES",
    "RosterVIew",
    "Leave",
    "NotificationCount",
    "NotificationList",
    "ImpactAnalysis",
    "CrqReview",
    "MopCreateView",
    "MopValidateView",
    "LoginDetails",
    "Activity",
    "Holiday",
    "Plan",
    "ActivityPhase",
    "TaskConfig",
    "GlobalSettingsPermission",
    "GlobalSettingsRoles",
    "GlobalSettingsModules",
    "GlobalSettingsSubModules",
    "ORG_VERTICAL_LIST",
    "ORG_FUNCTION_LIST",
    "ORG_DOMAIN_LIST",
    "ORG_SUBDOMAIN_LIST",
    "ShiftDropdown",
    "NetworkFreeze",
    "GoldenSetTag",
    "FutureWeekTag",
    "StageWorkflow",
    "CrqReschedule",
    "CrqValidation",
    "Scheduling",
    "NotificationConfig",
    "CabKpi",
    "CabQueue",
    "CabSession",
    "CabDashboard",
    "CabAdmin",
    "CabAudit",
    "CabCrq",
    "CabImpl",
    "UserManagementList",
    "UserManagementProfile",
    "Attendance",
    "AttributeUpdate",
    "CrqAnalytics",
    "DataAgentHistory",
    "ImpactBatch",
    "Checkpoints",
    "FetchProgress",
    "CabRejectReasons",
    "CancelledCrq",
    "MopDocument",
    "MopReview",
    "AuditLog",
    "CrqReassign"
  ],
});
