import Box from "@mui/material/Box";
import type { useTabColorTokens } from "../../../../style/theme";
import { alpha, Typography } from "@mui/material";
import { MoreHorizOutlined } from "@mui/icons-material";

interface RailItemProps {
  label: string;
  sublabel: string;
  isActive: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  /** Omit to render the row without a context-menu trigger. */
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  c: ReturnType<typeof useTabColorTokens>;
}

export const RailItem: React.FC<RailItemProps> = ({
  label,
  sublabel,
  isActive,
  icon,
  onClick,
  onMenuClick,
  c,
}) => (
  <Box
    onClick={onClick}
    sx={{
      display: "grid",
      gridTemplateColumns: "26px 1fr auto",
      gap: "10px",
      alignItems: "center",
      px: "10px",
      py: "9px",
      borderRadius: "8px",
      cursor: "pointer",
      mb: "1px",
      bgcolor: isActive ? alpha(c.accent, 0.1) : "transparent",
      color: isActive ? c.accent : c.textPrimary,
      border: `1px solid ${isActive ? alpha(c.accent, 0.25) : "transparent"}`,
      transition: "all 0.1s",
      "&:hover": {
        bgcolor: isActive
          ? alpha(c.accent, 0.12)
          : c.isDark
          ? "rgba(255,255,255,0.04)"
          : "rgba(13,27,42,0.04)",
      },
      "&:hover .rail-menu-btn": { opacity: 1 },
    }}
  >
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "6px",
        bgcolor: isActive
          ? alpha(c.accent, 0.15)
          : c.isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(13,27,42,0.05)",
        color: isActive ? c.accent : c.textSecondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        fontSize="0.78rem"
        fontWeight={isActive ? 600 : 400}
        color="inherit"
        fontFamily="'JetBrains Mono', monospace"
        noWrap
        letterSpacing="-0.01em"
      >
        {label}
      </Typography>
      <Typography
        fontSize="0.7rem"
        color={isActive ? alpha(c.accent, 0.75) : c.textDim}
        noWrap
        mt="1px"
      >
        {sublabel}
      </Typography>
    </Box>

    {onMenuClick && (
      <Box
        component="button"
        className="rail-menu-btn"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onMenuClick(e);
        }}
        sx={{
          opacity: 0,
          width: 22,
          height: 22,
          borderRadius: "4px",
          border: "none",
          bgcolor: "transparent",
          color: isActive ? c.accent : c.textDim,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.12s, background 0.1s",
          "&:hover": {
            bgcolor: c.isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.06)",
          },
        }}
      >
        <MoreHorizOutlined sx={{ fontSize: 14 }} />
      </Box>
    )}
  </Box>
);
