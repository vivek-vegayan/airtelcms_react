import { useEffect } from "react";
import { useLocation } from "react-router";
import { useAppSelector } from "../app/hooks";
import { RouteFallback } from "../components/loading/PageLoader";

const SFTP_APP_URL = (import.meta.env.VITE_SFTP_APP_URL as string | undefined) ?? "/cms_sftp/";

/**
 * SFTP Management lives in its own app (cms_sftp_react + cms_sftp_spring).
 * This route keeps /sftp-management/* inside CHM's RBAC (it's rendered under
 * PrivateRoute), then hands the current session token to that app in the URL
 * fragment. A fragment is never sent to a server or in a Referer header, and
 * the SFTP app strips it from the address bar on load. Its backend validates
 * the token against the same AUTH_JWT_TOKENS table, so logout here ends the
 * session there too.
 */
export default function SftpAppRedirect() {
  const { pathname } = useLocation();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    const subPath = pathname.slice(pathname.indexOf("/sftp-management"));
    const target = `${SFTP_APP_URL.replace(/\/$/, "")}${subPath}`;
    window.location.replace(token ? `${target}#token=${encodeURIComponent(token)}` : target);
  }, [pathname, token]);

  return <RouteFallback label="Opening SFTP Management…" />;
}
