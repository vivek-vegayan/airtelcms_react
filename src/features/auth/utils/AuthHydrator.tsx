import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { authStorage, USER_KEY } from "../../../app/store/auth.storage";
import {
  currentInAppPath,
  postLoginRedirect,
} from "../../../app/store/postLoginRedirect";
import { useLazyGetLoggedUserQuery } from "../api/auth.api";
import {
  normalizeRBAC,
  normalizeModuleHierarchy,
} from "../utils/rbacNormalizer";
import { finishHydration, logout, setUser } from "../slices/auth.slice";
import type { AuthUser, StoredUser } from "../types/auth.types";
import { useGlobalLoading } from "../../../components/loading/LoadingProvider";

const parseStoredUser = (raw: string | null): StoredUser | null => {
  try {
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
};

const AuthHydrator = () => {
  const dispatch = useAppDispatch();
  const [fetchUser] = useLazyGetLoggedUserQuery();
  // Drives the app's Global Loader for the real bootstrap window (session
  // validation on first paint / refresh) instead of the old blanket
  // "any RTK Query request in flight" counter — this is the only place a
  // full-screen loader should ever appear outside of an explicit page load.
  const [hydrating, setHydrating] = useState(true);
  useGlobalLoading(hydrating, "auth-hydration");

  useEffect(() => {
    // Builds before the memory-only token kept it in localStorage; make sure
    // an upgraded browser doesn't keep a readable copy lying around.
    authStorage.clearLegacyToken();

    // The bearer token is memory-only, so after a reload there is none to
    // send. getloggeduserdetails is authenticated instead by the httpOnly
    // `jwt` cookie (service/api.ts sends credentials: "include", and the
    // backend's JwtAuthenticationFilter falls back to that cookie when no
    // Authorization header is present). Success means the server-side
    // session is still live; any failure means the user must sign in.
    const hydrateFromSession = async () => {
      // Paint the last-known user immediately so the UI doesn't blank out
      // while the validation call below is in flight; it gets overwritten
      // with the server's response (or discarded on failure) either way.
      const cachedUser = authStorage.getUser();
      if (cachedUser) {
        dispatch(setUser({ ...cachedUser, authenticated: true }));
      }

      try {
        const userRes = await fetchUser().unwrap();

        const user: AuthUser = {
          olmId: userRes.olmId,
          employeeName: userRes.employeeName,
          roleCode: userRes.roleCode,
          userId: userRes.userId,
          modules: normalizeRBAC(userRes),
          moduleHierarchy: normalizeModuleHierarchy(userRes),
          authenticated: true,
        };

        dispatch(setUser(user));
        authStorage.setUser({
          olmId: user.olmId,
          employeeName: user.employeeName,
          roleCode: user.roleCode,
          userId: user.userId,
          modules: user.modules,
          moduleHierarchy: user.moduleHierarchy,
        });
      } catch {
        // Backend rejected the session (cookie expired / invalid / revoked) —
        // only now is it correct to treat the user as logged out.
        authStorage.clear();
        dispatch(logout());
      } finally {
        dispatch(finishHydration());
        setHydrating(false);
      }
    };

    // A cached profile is the marker that this browser had a session; without
    // one there's nothing to resume, so skip the round trip.
    if (authStorage.getUser()) {
      void hydrateFromSession();
    } else {
      // Cold start with no session at all: whatever URL is in the address bar
      // was typed or bookmarked by the person about to sign in, so it's theirs
      // to return to. This is the ONLY place a post-login redirect is ever
      // recorded — in particular PrivateRoute no longer smuggles the outgoing
      // route out through history state, which is how a logged-out user's last
      // page used to end up being handed to the next person who signed in.
      const requested = currentInAppPath();
      if (requested !== "/" && !requested.startsWith("/login")) {
        postLoginRedirect.set(requested);
      }
      dispatch(logout());
      dispatch(finishHydration());
      setHydrating(false);
    }

    // Cross-tab sync: this fires in every OTHER tab whenever localStorage
    // changes here (never in the tab that made the write). The profile key is
    // the session marker now that the token isn't stored; the jwt cookie
    // itself is shared by every tab, so a tab only has to re-check with the
    // server to pick up a sign-in made elsewhere.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== USER_KEY) return;

      if (!event.newValue) {
        // Another tab signed out. Its localStorage removals are what woke us,
        // so the shared keys are already gone; this call is here for the
        // tab-scoped pending redirect, which that tab could not reach.
        authStorage.clear();
        dispatch(logout());
        return;
      }

      // Every tab rewrites the profile when it hydrates, so only react to a
      // genuinely new session — a sign-in from logged-out, or a different
      // user — not to the same profile being saved again.
      const previous = parseStoredUser(event.oldValue);
      const next = parseStoredUser(event.newValue);
      if (!previous || previous.userId !== next?.userId) {
        void hydrateFromSession();
      }
    };

    window.addEventListener("storage", handleStorage);

    // Defense against bfcache: if the browser restores this page from an
    // in-memory snapshot (event.persisted) instead of re-running main.tsx —
    // e.g. pressing Back right after logout — re-validate against the
    // backend instead of trusting whatever was painted before the snapshot,
    // so a revoked/expired session can't leave a stale authenticated UI up.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      if (authStorage.getUser()) {
        void hydrateFromSession();
      } else {
        dispatch(logout());
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [dispatch, fetchUser]);

  return null;
};

export default AuthHydrator;
