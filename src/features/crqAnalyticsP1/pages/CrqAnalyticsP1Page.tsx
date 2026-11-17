import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { CrqJourneyPage } from "../../crqJourney/pages/CrqJourneyPage";
import { P1FilterBar } from "../components/P1FilterBar";
import { P1DrillDrawer } from "../components/P1DrillDrawer";
import { P1Context, type P1ContextValue } from "../hooks/useP1Context";
import { useP1Filters } from "../hooks/useP1Filters";
import type { P1Drill, P1View } from "../types/crqAnalyticsP1.types";
import { useP1Colors } from "../utils/p1Colors";
import P1PendencyView from "./P1PendencyView";
import P1ResultsView from "./P1ResultsView";
import P1TeamsView from "./P1TeamsView";

const HEADINGS: Record<P1View, { eyebrow: string; title: string; text: string; note?: string }> = {
  pendency: {
    eyebrow: "Pendency",
    title: "How old is the open work?",
    text: "Click any number to see the CRQs behind it.",
    note: "Open CRQs are always counted as of now, so the date range does not change the ageing grid. It applies to Closed, Cancelled and Rejected in Team-wise status.",
  },
  results: {
    eyebrow: "Results · for managers",
    title: "How CRQs ended",
    text: "Every chart has a Table view with the exact numbers. Hover a bar for details, click it for the CRQs.",
  },
  teams: {
    eyebrow: "Teams & people",
    title: "Who does the work, and on what",
    text: "CCB prepares the change (first four stages). SE approves, runs and closes it (last three).",
  },
};

interface Props {
  view: P1View;
  /** Optional content above the heading (e.g. a view switcher). */
  switcher?: ReactNode;
}

/**
 * CRQ Analytics Phase 1 (Pendency · Results · Teams & people) on the CRQ_AN_* analytics layer.
 * Each card reads its own endpoint; every number opens the CRQs behind it, and a CRQ opens
 * its journey.
 */
export default function CrqAnalyticsP1Page({ view, switcher }: Props) {
  const f = useP1Filters(view);
  const colors = useP1Colors();
  const [drill, setDrill] = useState<P1Drill | null>(null);
  const [months, setMonths] = useState(6);
  const [fullJourney, setFullJourney] = useState<string | null>(null);

  const openDrill = useCallback((d: P1Drill) => setDrill(d), []);
  const ctx = useMemo<P1ContextValue>(() => ({ f, colors, openDrill, months, setMonths }), [f, colors, openDrill, months]);
  const head = HEADINGS[view];
  const t = colors.tokens;

  // The scheduler's own CRQ Journey replaces the page; this component stays mounted, so Back
  // returns to the same view, filters and open list.
  if (fullJourney) {
    return <CrqJourneyPage crqNo={fullJourney} onBack={() => setFullJourney(null)} />;
  }

  return (
    <P1Context.Provider value={ctx}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1, minWidth: 0 }}>
        {switcher}

        <Box>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textSecondary }}>{head.eyebrow}</Typography>
          <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700, color: t.textPrimary, letterSpacing: "-0.01em" }}>
            {head.title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: t.textSecondary, mt: 0.5, maxWidth: 760 }}>{head.text}</Typography>
        </Box>

        <P1FilterBar f={f} note={head.note} />

        {view === "pendency" && <P1PendencyView />}
        {view === "results" && <P1ResultsView />}
        {view === "teams" && <P1TeamsView />}
      </Box>

      <P1DrillDrawer
        drill={drill}
        onClose={() => setDrill(null)}
        onOpenFullJourney={(crqNo) => {
          setDrill(null);
          setFullJourney(crqNo);
        }}
      />
    </P1Context.Provider>
  );
}
