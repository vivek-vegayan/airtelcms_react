import React from "react";
import { Button } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

interface CustomActionButtonProps {
  label: string;
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

  return (
    <Button
      variant="contained"
      size="small"
      disabled={disabled}
      onClick={handleClick}
      startIcon={startIcon || <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
      sx={{
        height: 34,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "none",
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
      {label}
    </Button>
  );
};

export default CustomActionButton;