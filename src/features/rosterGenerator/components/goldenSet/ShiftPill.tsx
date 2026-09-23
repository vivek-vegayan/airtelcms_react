import { alpha, Box } from "@mui/material";
import { MONO } from "./goldenGrid.constants";
import { getShiftColor } from "./goldenGrid.utils";

export default function ShiftPill({
  code,
  size = "md",
  onClick,
  active,
}: {
  code: string;
  size?: "sm" | "md";
  onClick?: () => void;
  active?: boolean;
}) {
  const sc = getShiftColor(code);
  return (
    <Box
      component={onClick ? "button" : "span"}
      onClick={onClick}
      sx={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: size === "sm" ? 30 : 36,
        height: size === "sm" ? 22 : 26,
        px: 0.75,
        borderRadius: "6px",
        fontFamily: MONO,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 700,
        border: "1.5px solid",
        borderColor: active ? sc.border : alpha(sc.border, 0.5),
        bgcolor: sc.background,
        color: sc.color,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
        boxShadow: active ? `0 0 0 2.5px ${alpha(sc.border, 0.4)}` : "none",
        "&:hover": onClick
          ? { borderColor: sc.border, filter: "brightness(0.96)" }
          : undefined,
      }}
    >
      {code}
    </Box>
  );
}
