import { Switch, styled } from "@mui/material";

/**
 * Compact 38×21 switch themed from theme.ts tokens (success when on, the
 * app-wide trackOff neutrals when off). Replaces the hand-rolled CSS toggle
 * so keyboard focus/ARIA come from MUI for free.
 */
const NotifSwitch = styled(Switch)(({ theme }) => {
  const isDark = theme.palette.mode === "dark";
  return {
    width: 38,
    height: 21,
    padding: 0,
    "& .MuiSwitch-switchBase": {
      padding: 0,
      margin: 3,
      transitionDuration: "200ms",
      "&.Mui-checked": {
        transform: "translateX(17px)",
        "& + .MuiSwitch-track": {
          backgroundColor: theme.palette.success.main,
          borderColor: theme.palette.success.main,
          opacity: 1,
        },
      },
      "&.Mui-disabled": {
        opacity: 0.45,
      },
    },
    "& .MuiSwitch-thumb": {
      width: 15,
      height: 15,
      backgroundColor: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
    },
    "& .MuiSwitch-track": {
      borderRadius: 21 / 2,
      boxSizing: "border-box",
      backgroundColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(13,27,42,0.09)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(13,27,42,0.12)"}`,
      opacity: 1,
      transition: theme.transitions.create(
        ["background-color", "border-color"],
        { duration: 200 },
      ),
    },
  };
});

export default NotifSwitch;
