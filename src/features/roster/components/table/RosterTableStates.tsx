import { Box, Stack, TableCell, TableRow, Typography } from "@mui/material";
import FilterSvg from "../../../../assets/svg/RosterEmpty.svg";
import RosterNotGeneratedSvg from "../../../../assets/svg/RosterNotGenerated.svg";

/** Full-width error row shown when the roster query fails. */
export const RosterErrorRow = ({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 5, border: "none" }}>
      <Stack alignItems="center" spacing={1}>
        <img src={RosterNotGeneratedSvg} alt="Roster not generated" width={220} />
        <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
          {message}
        </Typography>
      </Stack>
    </TableCell>
  </TableRow>
);

/** Full-width informational row (no data / no filter matches). */
export const RosterEmptyRow = ({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
      <Typography color="text.secondary">{message}</Typography>
    </TableCell>
  </TableRow>
);

/** Placeholder shown until a sub-domain filter is selected. */
export const SelectFilterPlaceholder = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "calc(100vh - 220px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    }}
  >
    <img src={FilterSvg} alt="Select Filter" width={650} />
  </Box>
);

/** Full-page placeholder shown when the roster hasn't been generated for the selected range. */
export const RosterNotGeneratedPlaceholder = ({
  message = "Roster not generated for selected range",
}: {
  message?: string;
}) => (
  <Box
    sx={{
      width: "100%",
      minHeight: "calc(100vh - 220px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 1.5,
    }}
  >
    <img src={RosterNotGeneratedSvg} alt="Roster not generated" width={340} />
    <Typography variant="h6" color="text.secondary" fontWeight={600}>
      {message}
    </Typography>
  </Box>
);
