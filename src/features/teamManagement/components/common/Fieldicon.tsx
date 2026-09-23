import { Box } from "@mui/material";

interface Props {
  children: React.ReactNode;
}

export const FieldIcon = ({ children }: Props) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      color: "text.disabled",
      mr: 0.5,
      "& .MuiSvgIcon-root": { fontSize: 16 },
    }}
  >
    {children}
  </Box>
);