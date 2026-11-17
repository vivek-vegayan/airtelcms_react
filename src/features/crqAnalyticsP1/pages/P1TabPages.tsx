import CommonContainer from "../../../components/common/CommonContainer";
import CrqAnalyticsP1Page from "./CrqAnalyticsP1Page";

/* One routed page per Analytics tab: /analytics/pendency, /analytics/results, /analytics/teams-people. */

export function PendencyPage() {
  return (
    <CommonContainer>
      <CrqAnalyticsP1Page view="pendency" />
    </CommonContainer>
  );
}

export function ResultsPage() {
  return (
    <CommonContainer>
      <CrqAnalyticsP1Page view="results" />
    </CommonContainer>
  );
}

export function TeamsPeoplePage() {
  return (
    <CommonContainer>
      <CrqAnalyticsP1Page view="teams" />
    </CommonContainer>
  );
}
