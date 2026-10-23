import type { StoredUser } from "../../features/auth/types/auth.types";
import { postLoginRedirect } from "./postLoginRedirect";


export const USER_KEY = "auth_user";
// Where builds before the memory-only token change kept the bearer token.
// Nothing writes it any more; it's only ever removed, so a token left behind
// by an older build can't sit in storage where any script could read it.
const LEGACY_TOKEN_KEY = "access_token";
// Shared across tabs so activity in one tab keeps the others from idling out.
export const LAST_ACTIVITY_KEY = "auth_last_activity";

// The access token lives only in Redux (memory) — never in Web Storage,
// where any script injected via XSS could read and replay it. A reload
// re-authenticates through the httpOnly `jwt` cookie the backend sets on
// signin (see AuthHydrator), which JS can't read at all.
//
// The profile below is not a secret (name, role, module list) and is kept in
// localStorage so other tabs and the many components that read it
// synchronously have it immediately. It's re-validated against the backend
// on every bootstrap, so a stale copy can't be used to skip that check.
export const authStorage = {
  setUser(user: StoredUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setLastActivity(at: number = Date.now()) {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  },

  getLastActivity(): number | null {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    const at = raw ? Number(raw) : NaN;
    return Number.isFinite(at) ? at : null;
  },

  clearLegacyToken() {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    // Tearing down a session also drops wherever that session was headed.
    // Hooking it here rather than at each of the logout call sites (header
    // menu, AccessDenied, the global 401 handler, a failed token validation)
    // is what guarantees the next user to sign in on this machine lands on
    // their own default route instead of the previous user's last page.
    postLoginRedirect.clear();
  },
};
