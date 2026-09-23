/**
 * Turns the free-text `session_link` a CAB session carries into something safe
 * to put in an href, or null when there is nothing to link to.
 *
 * The column is whatever the planner typed, so all three of these are real:
 *   "http://192.168.0.50:5174/airtelchmbeta/"  → used as-is
 *   "test.com"                                 → "https://test.com"
 *   NULL / ""                                  → null
 *
 * The bare-host case is why this exists: `<a href="test.com">` is a *relative*
 * path, so it would navigate inside the app instead of out to the meeting.
 * Anything carrying some other scheme is refused rather than guessed at, so a
 * `javascript:` value cannot ride in from the database into an href.
 */
export function toSessionUrl(link?: string | null): string | null {
  const raw = link?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  return `https://${raw}`;
}
