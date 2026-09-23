import { Box, useTheme } from "@mui/material";

export const CommonContainerWithoutTab = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        marginTop: "50px",
        marginLeft: "60px",
        marginRight: "10px",
        maxWidth: "100%",
        overflow: "auto",
        height: {
          xs: "calc(100vh - 50px)",
          sm: "calc(100vh - 50px)",
          md: "calc(100vh - 40px)",
          lg: "auto",
          xl: "calc(100vh - 40px)",
        },
        minHeight: "500px",
        p: {
          xs: "0px 8px",
          sm: "4px 12px",
          md: "4px 18px",
          lg: "4px 40px",
          xl: "8px 16px",
        },
        backgroundColor: theme.palette.background.default,

      }}
    >
      {children}
    </Box>
  );
};