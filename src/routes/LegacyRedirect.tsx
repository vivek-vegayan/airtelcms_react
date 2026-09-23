import { Navigate, useLocation } from "react-router";

interface LegacyRedirectProps {
  /** Absolute path this legacy URL now lives at. */
  to: string;
}

/**
 * A `<Navigate replace>` that carries the rest of the location with it.
 *
 * Plain `<Navigate to="/x" />` drops the query string, the hash and
 * `location.state`, which would quietly break bookmarks that carry query
 * params and in-app links that hand the destination state (the Home
 * dashboard's "Full view" link passes an anchor date this way). Replacing
 * rather than pushing keeps the retired URL out of the back stack, so
 * Back from the new page goes where the user actually came from.
 */
const LegacyRedirect = ({ to }: LegacyRedirectProps) => {
  const { search, hash, state } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} state={state} replace />;
};

export default LegacyRedirect;
