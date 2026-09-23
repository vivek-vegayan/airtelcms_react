import React from "react";
import { Slide } from "@mui/material";
import { type TransitionProps } from "@mui/material/transitions";

export const SlideUpTransition = React.forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});