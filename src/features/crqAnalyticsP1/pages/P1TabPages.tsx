import CommonContainer from "../../../components/common/CommonContainer";
import CrqAnalyticsP1Page from "./CrqAnalyticsP1Page";

/* One routed page per Analytics tab: /analytics/pendency, /analytics/summary, /analytics/teams-people. */

export function PendencyPage() {
  return (
    <CommonContainer>
      <CrqAnalyticsP1Page view="pendency" />
    </CommonContainer>
  );
}

export function SummaryPage() {
  return (
    <CommonContainer>
      <CrqAnalyticsP1Page view="summary" />
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
