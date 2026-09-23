import { getOrgFilterVisibility } from "../../orgHierarchy/config/orgFilterVisibility";

/**
 * Whether the user is even offered a Domain picker in the org-hierarchy
 * filter bar.
 *
 * This asks the same resolver the filter bar itself renders from, so the two
 * can never disagree: a user who has just been granted "Organization Domain"
 * gets a Domain picker AND has the domain they pick actually sent, instead of
 * picking one that a role-only lookup here would have thrown away.
 *
 * TEAM_MEMBER and TEAM_LEAD are not offered one: their scope is not something
 * they choose, it is whatever the backend resolves from their own user id, so
 * there is no domain for them to pick and none for us to send.
 */
export const roleHasDomainScope = (role?: string | null): boolean =>
  getOrgFilterVisibility(role).includes("domain");

/**
 * The `domainId` a Scheduler screen should query with. Three distinct
 * states, and the difference between the last two is what stops a
 * domain-less role from being stuck behind the "select a filter" screen:
 *
 * - `number`    - the domain the user picked.
 * - `null`      - the role has no domain scope, so the request must carry no
 *                 domainId at all. The stage procedures branch on the
 *                 caller's role and filter such users by their own OLM id +
 *                 sub-domain instead, so a domain would be meaningless here.
 * - `undefined` - the role does have a Domain picker but hasn't used it yet,
 *                 so the screen must keep waiting rather than query.
 */
export const resolveDomainScope = (
  role: string | null | undefined,
  selectedDomainId: number | undefined,
): number | null | undefined =>
  roleHasDomainScope(role) ? selectedDomainId : null;

/**
 * Whether the org scope is settled enough to fetch with - the domain either
 * chosen or established as not-applicable (null), and a sub-domain known.
 */
export const isOrgScopeReady = (
  domainId: number | null | undefined,
  subDomainId: number | null | undefined,
): boolean => domainId !== undefined && subDomainId != null;

/**
 * Scope query string for the "View Selected CRQ" deep link. `domainId` is
 * left out entirely for a domain-less role rather than sent as a made-up
 * value, so the cockpit resolves the same null scope this page used.
 */
export const buildScopeQuery = (
  domainId: number | null | undefined,
  subDomainId: number | null | undefined,
): string => {
  const params = new URLSearchParams();
  if (domainId != null) params.set("domainId", String(domainId));
  if (subDomainId != null) params.set("subDomainId", String(subDomainId));
  return params.toString();
};
