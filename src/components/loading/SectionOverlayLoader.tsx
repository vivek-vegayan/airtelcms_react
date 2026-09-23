import { Box, CircularProgress } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useLoadingVisibility } from "./LoadingProvider";

interface SectionOverlayLoaderProps {
  /** Whether this section (table, card, panel) is currently loading/refetching. */
  active: boolean;
  /** Spinner size in px. */
  size?: number;
  /** Border radius to match the containing surface. */
  borderRadius?: string | number;
}

/**
 * Semi-transparent overlay + centered spinner for a *section* of a page
 * (a table, a panel) that already has content on screen and is refreshing —
 * generalizes the pattern from RosterTableFrame. Place as the first child of
 * a `position: relative` container. Self-suppresses while a Global or Page
 * loader is active, so it never stacks under a full-screen loader.
 */
const SectionOverlayLoader = ({ active, size = 30, borderRadius = "10px" }: SectionOverlayLoaderProps) => {
  const theme = useTheme();
  const { globalActive, pageActive } = useLoadingVisibility();

  if (!active || globalActive || pageActive) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(theme.palette.background.paper, 0.75),
        zIndex: 50,
        borderRadius,
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
};

export default SectionOverlayLoader;
