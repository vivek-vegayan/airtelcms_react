import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNotifTokens } from "../style/notificationTokens";

interface StatusBadgeProps {
  active: boolean;
}

/** "Active / Inactive" pill with a pulsing live dot, colored from theme tokens. */
const StatusBadge = ({ active }: StatusBadgeProps) => {
  const theme = useTheme();
  const tk = useNotifTokens(theme);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1.25,
        py: 0.45,
        borderRadius: "999px",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        bgcolor: active
          ? tk.successDim
          : tk.isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(13,27,42,0.06)",
        color: active ? tk.success : tk.textSecondary,
        border: `1px solid ${active ? tk.successBorder : tk.border}`,
      }}
    >
      {active && (
        <Box
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "currentColor",
            flexShrink: 0,
            animation: "ntfPulse 2.4s ease-in-out infinite",
            "@keyframes ntfPulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.35 },
            },
          }}
        />
      )}
      {active ? "Active" : "Inactive"}
    </Box>
  );
};

export default StatusBadge;
