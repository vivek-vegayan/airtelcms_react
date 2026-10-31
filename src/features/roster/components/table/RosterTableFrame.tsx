import { type ReactNode } from "react";
import {
  Paper,
  Table,
  TableContainer,
  useTheme,
} from "@mui/material";
import SmartScrollContainer from "../../../../components/common/SmartScrollContainer";
import SectionOverlayLoader from "../../../../components/loading/SectionOverlayLoader";

/**
 * Default scroll viewport height: grows with the window so tall screens show
 * more rows, but never drops below the old fixed 450px. The 300px offset is
 * the page chrome around the grid (tabs, filter bar, toolbar, legend).
 */
const DEFAULT_TABLE_HEIGHT = "max(440px, calc(100vh - 300px))";

interface Props {
  /** Scroll viewport height passed to SmartScrollContainer. */
  height?: number | string;
  /** Semi-transparent spinner overlay (used while refetching). */
  loading?: boolean;
  /** Extra sx merged onto the <Table> (e.g. tableLayout overrides). */
  tableSx?: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Shared scrollable table shell for the Weekly and Monthly roster grids:
 * rounded Paper container + horizontal/vertical smart scrolling + a
 * sticky-header table with collapsed borders.
 */
export const RosterTableFrame = ({
  height = DEFAULT_TABLE_HEIGHT,
  loading = false,
  tableSx,
  children,
}: Props) => {
  const theme = useTheme();

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: "10px 10px 0 0",
        bgcolor: theme.palette.background.paper,
        position: "relative",
      }}
    >
      <SectionOverlayLoader active={loading} />

      <SmartScrollContainer height={height} enableHorizontal>
        <Table
          stickyHeader
          size="small"
          sx={{
            tableLayout: "fixed",
            width: "100%",
            borderCollapse: "collapse",
            ...tableSx,
          }}
        >
          {children}
        </Table>
      </SmartScrollContainer>
    </TableContainer>
  );
};
