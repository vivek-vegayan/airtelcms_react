import { IconButton, Tooltip, type SxProps, type Theme } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

interface Props {
  onClick: () => void;
  /** Spins the icon and blocks re-clicks while the refetch is in flight. */
  busy?: boolean;
  /** Greyed out when the screen has nothing to refresh yet (no scope picked). */
  disabled?: boolean;
  title?: string;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
}

/**
 * The one refresh affordance used across the app - notably the button that sits
 * at the end of every organization-hierarchy filter bar.
 *
 * The Tooltip wraps a <span> because MUI cannot attach a listener to a disabled
 * button, and the tooltip is exactly what explains *why* it is disabled.
 */
export const RefreshIconButton = ({
  onClick,
  busy = false,
  disabled = false,
  title = "Refresh data",
  size = "small",
  sx,
}: Props) => (
  <Tooltip title={busy ? "Refreshing…" : title} arrow>
    <span style={{ display: "inline-flex" }}>
      <IconButton
        size={size}
        onClick={onClick}
        disabled={disabled || busy}
        aria-label={title}
        sx={{
          color: "text.secondary",
          "&:hover": { color: "primary.main" },
          ...sx,
        }}
      >
        <RefreshRoundedIcon
          sx={{
            fontSize: size === "small" ? 18 : 22,
            animation: busy ? "chm-refresh-spin 0.8s linear infinite" : "none",
            "@keyframes chm-refresh-spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
          }}
        />
      </IconButton>
    </span>
  </Tooltip>
);

export default RefreshIconButton;
