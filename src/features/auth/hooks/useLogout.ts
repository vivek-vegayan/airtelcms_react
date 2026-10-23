import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { authStorage } from "../../../app/store/auth.storage";
import { api } from "../../../service/api";
import { useLogoutMutation } from "../api/auth.api";
import { logout } from "../slices/auth.slice";

/**
 * Ends the session on the server, then tears it down locally. Shared by the
 * header menu, AccessDenied and the idle timeout so every user-facing logout
 * does the same cleanup.
 */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const olmId = useAppSelector((s) => s.auth.user?.olmId);
  const [logoutApi] = useLogoutMutation();

  return useCallback(async () => {
    try {
      // Revokes the DB-backed session and clears the httpOnly jwt cookie.
      // Skipping this would leave the session live, and the next signin
      // would be refused with "Already Logged".
      await logoutApi({ olmId: olmId ?? "" }).unwrap();
    } catch {
      console.warn("Logout API failed, continuing local logout");
    } finally {
      // Only clear the auth keys, not the whole storage — a blanket
      // localStorage.clear() also wiped unrelated saved preferences
      // (theme, brand colour, sidebar state) on every logout.
      // Clearing these keys fires the native `storage` event in every
      // other open tab, which AuthHydrator listens for to log them out too.
      authStorage.clear();
      dispatch(logout());
      // Clear every cached query too — otherwise a re-login (same user or a
      // different one on a shared machine) can briefly render this session's
      // stale attendance/roster/profile data before a refetch catches up.
      dispatch(api.util.resetApiState());
      navigate("/login", { replace: true });
    }
  }, [dispatch, navigate, olmId, logoutApi]);
};
