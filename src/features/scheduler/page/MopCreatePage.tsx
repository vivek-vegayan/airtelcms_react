import React from "react";
import { GenericStagePage } from "../components/generic/GenericStagePage";

interface Props {
  /** null = role has no domain scope (see util/orgScope.ts). */
  domainId?: number | null;
  subDomainId?: number;
  /** CRQ number the Global CRQ Search routed to - narrows the listing to it. */
  focusCrqNo?: string;
}

export const MopCreatePage: React.FC<Props> = ({ domainId, subDomainId, focusCrqNo }) => (
  <GenericStagePage
    stageKey="mopcreate"
    domainId={domainId}
    subDomainId={subDomainId}
    focusCrqNo={focusCrqNo}
  />
);

export default MopCreatePage;
