import { Stack, Box, Typography } from "@mui/material";

interface Props {
  step: number;
  label: string;
  color: string;
}

export const SectionLabel = ({ step, label, color }: Props) => (
  <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        bgcolor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Typography variant="caption" fontWeight={700} color="#fff" lineHeight={1}>
        {step}
      </Typography>
    </Box>
    <Typography
      variant="overline"
      fontWeight={700}
      letterSpacing={1.4}
      color="text.secondary"
      sx={{ lineHeight: 1 }}
    >
      {label}
    </Typography>
  </Stack>
);