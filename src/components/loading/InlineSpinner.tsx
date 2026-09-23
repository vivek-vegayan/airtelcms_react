import { CircularProgress, type CircularProgressProps } from "@mui/material";

const SIZE_MAP = { xs: 14, sm: 18, md: 24 } as const;

interface InlineSpinnerProps extends Omit<CircularProgressProps, "size"> {
  size?: keyof typeof SIZE_MAP;
}

/**
 * Standardized small spinner for buttons/menu items (e.g. a submit button's
 * "in flight" state). Always local — never consults the loading context,
 * since it never conflicts with a full-screen loader by design.
 */
const InlineSpinner = ({ size = "sm", ...props }: InlineSpinnerProps) => (
  <CircularProgress size={SIZE_MAP[size]} {...props} />
);

export default InlineSpinner;
