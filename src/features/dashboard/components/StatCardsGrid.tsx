import { Box } from "@mui/material";
import type { Colors } from "../types/colorTypes";
import type { StatCardConfig } from "../types/dashboard.types";
import { DASHBOARD_GRID_GAP, fadeIn } from "../constants/dashboard.styles";
import { StatCard } from "./StatCard";

interface StatCardsGridProps {
  cards: readonly StatCardConfig[];
  colors: Colors;
  mounted: boolean;
  delay: number;
}

export function StatCardsGrid({ cards, colors, mounted, delay }: StatCardsGridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        // `minmax(0, 1fr)` rather than `1fr`: a long label or a wide value can
        // otherwise push a column past its share and overflow the card.
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gridAutoRows: "1fr",
        gap: DASHBOARD_GRID_GAP,
        // Fills the assignments card's height when the two sit side by side
        // (lg+); when they stack, the tiles keep their own natural height
        // instead of inheriting a row that is now far too tall.
        height: { xs: "auto", lg: "100%" },
        ...fadeIn(mounted, delay),
      }}
    >
      {cards.map((card) => (
        <StatCard key={card.key} config={card} colors={colors} />
      ))}
    </Box>
  );
}
