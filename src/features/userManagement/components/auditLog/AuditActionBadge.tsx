import { Chip, useTheme } from "@mui/material";
import { useTabColorTokens } from "../../../../style/theme";
import { actionTone, type AuditTone } from "./auditLogFormat";
import type { AuditActionCode } from "../../types/auditLog";

/**
 * The verb, as a colour-coded badge.
 *
 * Colour is semantic, not decorative: destructive verbs (DELETE / REJECT /
 * CANCEL) read red, additive ones green, everything reversible blue or amber.
 * Someone scanning a page of audit rows should be able to find the dangerous
 * ones without reading a single word.
 *
 * Every colour comes from `useTabColorTokens`, so the badges follow the user's
 * brand colour and both light and dark themes, exactly as the rest of the app's
 * chips do.
 */
const AuditActionBadge = ({
  action,
  size = "small",
}: {
  action: AuditActionCode;
  size?: "small" | "medium";
}) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const palette: Record<AuditTone, { fg: string; bg: string; border: string }> = {
    success: { fg: tk.success, bg: tk.successDim, border: tk.successBorder },
    info: { fg: tk.info, bg: tk.infoDim, border: tk.infoBorder },
    warning: { fg: tk.warning, bg: tk.warningDim, border: tk.warningBorder },
    danger: { fg: tk.danger, bg: tk.dangerDim, border: tk.dangerBorder },
    accent: { fg: tk.accent, bg: tk.accentDim, border: tk.accentBorder },
    neutral: { fg: tk.textSecondary, bg: tk.surface2, border: tk.border },
  };

  const c = palette[actionTone(action)];

  return (
    <Chip
      size="small"
      label={action}
      sx={{
        height: size === "medium" ? 24 : 21,
        fontSize: size === "medium" ? 11.5 : 10.5,
        fontWeight: 800,
        letterSpacing: 0.3,
        color: c.fg,
        bgcolor: c.bg,
        border: `1px solid ${c.border}`,
        "& .MuiChip-label": { px: 0.9 },
      }}
    />
  );
};

export default AuditActionBadge;
