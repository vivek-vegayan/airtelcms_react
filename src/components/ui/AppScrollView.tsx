import React from "react";
import { Box, type BoxProps, styled } from "@mui/material";

interface AppScrollViewProps extends BoxProps {
  direction?: "vertical" | "horizontal" | "both";
  hideScrollbar?: boolean;
  maxHeight?: string | number;
  maxWidth?: string | number;
}

// Styled component with advanced scrollbar CSS
const StyledScrollBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hideScrollbar" && prop !== "direction",
})<{ hideScrollbar?: boolean; direction?: "vertical" | "horizontal" | "both" }>(
  ({ theme, hideScrollbar, direction }) => ({
    // Determine overflow logic based on direction
    overflowY:
      direction === "vertical" || direction === "both" ? "auto" : "hidden",
    overflowX:
      direction === "horizontal" || direction === "both" ? "auto" : "hidden",

    // Smooth scrolling for iOS
    WebkitOverflowScrolling: "touch",

    // Firefox scrollbar styling
    scrollbarWidth: hideScrollbar ? "none" : "thin",
    scrollbarColor: hideScrollbar
      ? "transparent transparent"
      : "#CBD5E1 transparent",

    // Webkit (Chrome, Safari, Edge) scrollbar styling
    "&::-webkit-scrollbar": {
      width: hideScrollbar ? "0px" : "6px", // Vertical scrollbar width
      height: hideScrollbar ? "0px" : "6px", // Horizontal scrollbar height
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
      margin: "4px", // Adds slight padding to top/bottom of the scrollbar
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#CBD5E1", // Slate 300 (Soft Gray)
      borderRadius: "10px", // Perfectly rounded pill shape
      border: "2px solid transparent", // Creates a "floating" effect
      backgroundClip: "padding-box",
      transition: "background-color 0.2s ease-in-out",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "#94A3B8", // Slate 400 (Darker on hover)
    },
    // Corner where vertical and horizontal scrollbars meet
    "&::-webkit-scrollbar-corner": {
      background: "transparent",
    },
  }),
);

export const AppScrollView: React.FC<AppScrollViewProps> = ({
  children,
  direction = "vertical",
  hideScrollbar = false,
  maxHeight,
  maxWidth,
  sx,
  ...rest
}) => {
  return (
    <StyledScrollBox
      direction={direction}
      hideScrollbar={hideScrollbar}
      sx={{
        maxHeight,
        maxWidth,
        // If horizontal, default to flex row to prevent children from wrapping
        ...(direction === "horizontal" && {
          display: "flex",
          flexDirection: "row",
        }),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </StyledScrollBox>
  );
};
