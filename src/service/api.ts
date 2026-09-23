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
import { logout } from "../features/auth/slices/auth.slice";

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

const isAuthLifecycleRequest = (args: string | FetchArgs): boolean => {
  const url = typeof args === "string" ? args : args.url;
  return AUTH_LIFECYCLE_PATHS.some((path) => url.includes(path));
};

// Global session-expiration handler: any endpoint (other than login/logout
// themselves) that comes back 401/403 means the token was rejected by the
// backend — clear the cached session so PrivateRoute redirects to /login,
// instead of leaving the UI in a broken, half-authenticated state.
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, queryApi, extraOptions) => {
  const result = await rawBaseQuery(args, queryApi, extraOptions);

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
    "SftpWindowsFiles",
    "DataAgentHistory",
    "ImpactBatch",
    "Checkpoints",
    "CabRejectReasons",
    "CancelledCrq",
    "MopDocument",
    "MopReview",
    "AuditLog"
  ],
});
