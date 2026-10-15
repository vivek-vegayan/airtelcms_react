import React from "react";
import { Button, Tooltip } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

interface CustomActionButtonProps {
  label: string;
  /**
   * Opt-in responsive mode: when set, the parent can swap the full label for
   * this one (`.cab-label-full` / `.cab-label-short`) or hide both for an
   * icon-only button; the full label stays available as a tooltip.
   */
  shortLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  url?: string;
  startIcon?: React.ReactNode;
  colors: {
    accent: string;
    border: string;
    textDim: string;
    trackOff: string;
  };
}

const CustomActionButton: React.FC<CustomActionButtonProps> = ({
  label,
  shortLabel,
  disabled = false,
  onClick,
  url,
  startIcon,
  colors,
}) => {
  const handleClick = () => {
    if (disabled) return;

    if (onClick) {
      onClick();
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  const responsive = shortLabel !== undefined;

  const button = (
    <Button
      variant="contained"
      size="small"
      disabled={disabled}
      onClick={handleClick}
      aria-label={responsive ? label : undefined}
      className={responsive ? "cab-responsive" : undefined}
      startIcon={startIcon || <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
      sx={{
        height: 34,
        px: { xs: 1, xl: 1.5 },
        fontSize: { xs: 11.5, xl: 12 },
        fontWeight: 700,
        textTransform: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        "& .MuiButton-startIcon": { mr: { xs: 0.5, xl: 1 } },
        borderRadius: "8px",
        bgcolor: disabled ? colors.border : colors.accent,
        color: disabled ? colors.textDim : "#fff",
        boxShadow: "none",
        "&:hover": {
          bgcolor: disabled ? colors.border : colors.accent,
          boxShadow: "none",
        },
        "&.Mui-disabled": {
          bgcolor: colors.trackOff,
          color: colors.textDim,
          border: `1px solid ${colors.border}`,
        },
      }}
    >
      {responsive ? (
        <>
          <span className="cab-label-full">{label}</span>
          <span className="cab-label-short">{shortLabel}</span>
        </>
      ) : (
        label
      )}
    </Button>
  );

  if (!responsive) return button;

  // The parent may hide the label text (container queries), so keep the
  // full label reachable as a tooltip. The span lets it show while disabled.
  return (
    <Tooltip title={label}>
      <span style={{ display: "inline-flex", flexShrink: 0 }}>{button}</span>
    </Tooltip>
  );
};

export default CustomActionButton;