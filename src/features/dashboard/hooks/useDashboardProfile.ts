import { useAppSelector } from "../../../app/hooks";
import { useGetUserProfileQuery, type UserProfile } from "../../userManagement/api/userManagementApi";

export type DashboardProfileStatus = "loading" | "error" | "empty" | "ready";

export interface DashboardProfileState {
  profile?: UserProfile;
  status: DashboardProfileStatus;
  errorMessage?: string;
}

/** Owns the dashboard's live "My Profile" data, backed by /teamoverview/getuserprofile/{userId}. */
export function useDashboardProfile(): DashboardProfileState {
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.userId ? Number(user.userId) : undefined;

  const { data, isLoading, isError } = useGetUserProfileQuery(userId as number, {
    skip: !userId,
  });

  const profile = data?.profile;

  // isLoading (no cached data yet) drives the skeleton; a background
  // isFetching refetch keeps the current profile visible instead of
  // re-flashing it.
  const status: DashboardProfileStatus = isError
    ? "error"
    : isLoading
      ? "loading"
      : !profile
        ? "empty"
        : "ready";

  const errorMessage = status === "error" ? "Failed to load your profile. Please try again." : undefined;

  return { profile, status, errorMessage };
}
