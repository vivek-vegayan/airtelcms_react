import { Box, Typography, useTheme } from "@mui/material";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import { useTabColorTokens } from "../../../style/theme";

export interface AppTableEmptyStateProps {
  title?: string;
  description?: string;
  /** Switches the icon and colour to the error treatment. */
  isError?: boolean;
}

/**
 * The one "there is nothing here" panel every table falls back to.
 *
 * An empty grid and a failed fetch look identical unless they are told
 * apart, so `isError` is a first-class prop rather than a caller-supplied
 * string: a reader can tell "no results for this filter" from "this did
 * not load" without reading the copy.
 */
export const AppTableEmptyState = ({
  title,
  description,
  isError = false,
}: AppTableEmptyStateProps) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const Icon = isError ? ErrorOutlineRoundedIcon : InboxRoundedIcon;
  const heading = title ?? (isError ? "Could not load this table" : "No records found");
  const body =
    description ??
    (isError
      ? "The data could not be fetched. Try again in a moment."
      : "Nothing matches the current filters.");

  return (
    <Box sx={{ py: 6, px: 3, textAlign: "center", width: "100%" }}>
      <Icon sx={{ fontSize: 34, color: isError ? tk.danger : tk.textDim, mb: 1 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: tk.textSecondary }}>
        {heading}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: tk.textDim, mt: 0.5 }}>{body}</Typography>
    </Box>
  );
};

export default AppTableEmptyState;
