import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material";
import { toast } from "react-toastify";
import { authStorage } from "../../../app/store/auth.storage";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useTabColorTokens } from "../../../style/theme";
import { useLogout } from "../hooks/useLogout";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
// Activity fires constantly (mousemove, scroll); persisting it at most this
// often keeps localStorage writes cheap while staying far inside the timeout.
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000;
const CHECK_INTERVAL_MS = 1000;
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
] as const;

/**
 * Signs the user out after IDLE_TIMEOUT_MS without interaction, with a
 * one-minute warning first. The last-activity time is shared through
 * localStorage, so working in any tab keeps every tab signed in, and a
 * browser reopened long after it was left idle is signed out on load.
 * Mounted only while authenticated (see App.tsx).
 */
const IdleTimeoutGuard = () => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const logoutUser = useLogout();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warningRef = useRef(false);
  const loggingOutRef = useRef(false);

  const signOut = useCallback(() => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setSecondsLeft(null);
    void logoutUser();
  }, [logoutUser]);

  const staySignedIn = useCallback(() => {
    authStorage.setLastActivity();
    warningRef.current = false;
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (authStorage.getLastActivity() === null) authStorage.setLastActivity();

    let lastWrite = 0;
    const onActivity = () => {
      // Once the warning is up, only an explicit "Stay signed in" extends the
      // session — a stray mouse twitch shouldn't silently dismiss it.
      if (warningRef.current) return;
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      authStorage.setLastActivity(now);
    };

    const check = () => {
      if (loggingOutRef.current) return;
      const last = authStorage.getLastActivity();
      // Cleared by a logout in another tab; AuthHydrator's storage listener
      // tears this tab down.
      if (last === null) return;

      const remaining = last + IDLE_TIMEOUT_MS - Date.now();
      if (remaining <= 0) {
        toast.info("You were signed out after 30 minutes of inactivity.");
        signOut();
      } else if (remaining <= WARNING_BEFORE_MS) {
        warningRef.current = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else if (warningRef.current) {
        // Activity in another tab pushed the deadline back.
        warningRef.current = false;
        setSecondsLeft(null);
      }
    };

    // Capture phase so scrolling inside nested containers counts too.
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true, capture: true }),
    );
    // Background tabs throttle timers; re-check the moment the tab is visible.
    document.addEventListener("visibilitychange", check);
    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
    check();

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(intervalId);
    };
  }, [signOut]);

  return (
    <ConfirmDialog
      state={{
        open: secondsLeft !== null,
        title: "Are you still there?",
        body: `For your security, you'll be signed out in ${secondsLeft ?? 0} seconds due to inactivity.`,
        onConfirm: signOut,
        confirmLabel: "Log out now",
        cancelLabel: "Stay signed in",
      }}
      onClose={staySignedIn}
      c={colors}
    />
  );
};

export default IdleTimeoutGuard;
