
import React from "react";
import { Stack, Box, Typography } from "@mui/material";

export interface CrqInfoCardItem {
  label: string;
  value: React.ReactNode | ((data?: any) => React.ReactNode);
}

interface CrqInfoCardsProps {
  colors: any;
  items: CrqInfoCardItem[];
  data?: any;
}

const InfoBlock = ({
  label,
  value,
  colors,
}: {
  label: string;
  value: React.ReactNode;
  colors: any;
}) => (
  <Box
    sx={{
      bgcolor: colors.accentDim,
      borderRadius: colors.radius,
      px: 2,
      py: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minWidth: "180px",
      whiteSpace: "nowrap",
    }}
  >
    <Typography
      component="div"
      variant="caption"
      sx={{ color: colors.textSecondary, mb: 0.5, fontSize: "0.75rem" }}
    >
      {label}
    </Typography>
    <Typography
      component="div"
      variant="body2"
      sx={{ fontWeight: 600, color: colors.textPrimary }}
    >
      {value}
    </Typography>
  </Box>
);

const CrqInfoCards: React.FC<CrqInfoCardsProps> = ({ colors, items, data }) => {
  const resolveValue = (item: CrqInfoCardItem) =>
    typeof item.value === "function" ? item.value(data) : item.value;

  return (
    <Stack direction="row" gap={1.5} alignItems="center">
      {items.map((item, index) => (
        <InfoBlock
          key={`${item.label}-${index}`}
          label={item.label}
          value={resolveValue(item)}
          colors={colors}
        />
      ))}
    </Stack>
  );
};

export default CrqInfoCards;
