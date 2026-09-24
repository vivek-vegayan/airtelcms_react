import { alpha, useTheme } from "@mui/material";
import { useTabColorTokens } from "../../../style/theme";

/** Theme tokens plus the few shared styles of the reassignment page. */
export const useReassignTokens = () => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const ink = theme.palette.text.primary;
  return {
    tk,
    rule: `1px solid ${tk.border}`,
    /** Same caption style as the Stat tiles and table headers across the app. */
    label: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
      color: tk.textSecondary,
    },
    /** Free cell inside the shift window … */
    hatch: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${alpha(ink, 0.04)} 5px, ${alpha(ink, 0.04)} 6px)`,
    /** … and hours outside it. */
    hatchDark: `repeating-linear-gradient(45deg, ${alpha(ink, 0.05)}, ${alpha(ink, 0.05)} 5px, ${alpha(ink, 0.1)} 5px, ${alpha(ink, 0.1)} 6px)`,
  };
};
