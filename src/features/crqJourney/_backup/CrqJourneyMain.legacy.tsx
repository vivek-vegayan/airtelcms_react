// ─────────────────────────────────────────────────────────────────────────────
// BACKUP — previous /scheduler/crqjourney view (info-card + vertical audit-trail
// timeline built from get_crq_details). Superseded on 2026-08-17 by the
// /cabmanager/journey pipeline canvas, which CrqJourneyMain now renders.
//
// Nothing imports this file; it exists so the old page can be restored in one
// step. To restore: copy the component body below back into
// ../CrqJourneyMain.tsx (its dependencies — CrqDetailsPage, useCrqDetails and
// components/details/* — are all still present and unmodified).
// ─────────────────────────────────────────────────────────────────────────────
import { Box } from "@mui/material";
import { CrqDetailsPage } from "../pages/CrqDetailsPage";

// Renders at /scheduler/crqjourney. Deliberately a different visualization
// from /cabmanager/journey's CrqJourneyPage (horizontal pipeline canvas) —
// this is an info-card + vertical audit-trail timeline built from
// get_crq_details, which carries assignment/performer/timestamp detail the
// CAB pipeline view doesn't need.
export const CrqJourneyMainLegacy = () => (
  <Box>
    <CrqDetailsPage />
  </Box>
);
