import React from "react";
import { Box, Typography } from "@mui/material";
import { ChevronRightOutlined } from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";

interface OrgConfigBreadcrumbProps {
  segments: (string | undefined)[];
  c: ReturnType<typeof useTabColorTokens>;
}

export const OrgConfigBreadcrumb: React.FC<OrgConfigBreadcrumbProps> = ({ segments, c }) => {
  const filled = segments.filter((s): s is string => !!s);
  if (filled.length === 0) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: 2, flexWrap: "wrap" }}>
      {filled.map((seg, i) => (
        <React.Fragment key={`${seg}-${i}`}>
          {i > 0 && <ChevronRightOutlined sx={{ fontSize: 14, color: c.textDim }} />}
          <Typography
            fontSize="0.8rem"
            fontWeight={i === filled.length - 1 ? 600 : 400}
            color={i === filled.length - 1 ? c.textPrimary : c.textSecondary}
          >
            {seg}
          </Typography>
        </React.Fragment>
      ))}
    </Box>
  );
};
