import { Box, useTheme, type SxProps, type Theme } from "@mui/material";

const CommonContainer = ({
  children,
  sx,
}: {
  children: React.ReactNode;
  /** Optional overrides, applied after the defaults (existing callers unaffected). */
  sx?: SxProps<Theme>;
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={[
        {
          marginTop: "5px",
          maxWidth: "100%",
          overflow: "auto",
          height: {
            xs: "calc(100vh - 50px)",
            sm: "calc(100vh - 50px)",
            md: "calc(100vh - 40px)",
            lg: "auto",
            xl: "calc(100vh - 100px)",
          },
          minHeight: "500px",
          // Column flex so a routed page — or the loader standing in for one —
          // fills this container instead of collapsing to its own content.
          display: "flex",
          flexDirection: "column",
          p: {
            xs: "0px 8px",
            sm: "4px 12px",
            md: "4px 18px",
            lg: "4px 40px",
            xl: "8px 16px",
            // xl: "18px",
          },
          bgcolor: theme.palette.background.default,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
};

export default CommonContainer;
