import React, { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { Colors } from "../../../types/colorTypes";
import { ATTRIBUTE_INLINE_VALUES_LIMIT } from "../constants/attributeUpdate.constants";

interface AttributeValueListProps {
  values: string[];
  colors: Colors;
}

/**
 * Allowed values of a dropdown/radio attribute. Short lists render inline as
 * pills; long lists collapse behind a "Show N values" toggle.
 */
export const AttributeValueList: React.FC<AttributeValueListProps> = ({
  values,
  colors,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!values.length) return null;

  if (values.length <= ATTRIBUTE_INLINE_VALUES_LIMIT) {
    return (
      <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 1 }}>
        {values.map((value) => (
          <Box
            key={value}
            component="span"
            sx={{
              px: 1.2,
              py: "3px",
              fontSize: 12,
              borderRadius: "5px",
              bgcolor: colors.trackOff,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          >
            {value}
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Box sx={{ mt: 0.5 }}>
      <Button
        size="small"
        onClick={() => setExpanded((prev) => !prev)}
        startIcon={
          expanded ? (
            <ExpandMoreRoundedIcon sx={{ fontSize: 15 }} />
          ) : (
            <ChevronRightRoundedIcon sx={{ fontSize: 15 }} />
          )
        }
        sx={{
          textTransform: "none",
          fontSize: 12.5,
          fontWeight: 500,
          color: colors.accent,
          p: "4px 6px",
          minWidth: 0,
          "&:hover": { bgcolor: colors.accentDim },
        }}
      >
        {expanded ? "Hide values" : `Show ${values.length} values`}
      </Button>
      {expanded && (
        <Box
          sx={{
            mt: 0.6,
            px: 1.75,
            py: 1.2,
            borderRadius: colors.radius,
            bgcolor: colors.surface2,
            border: `1px solid ${colors.border}`,
          }}
        >
          {values.map((value) => (
            <Box
              key={value}
              sx={{ fontSize: 12.5, color: colors.textPrimary, py: "3px" }}
            >
              • {value}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AttributeValueList;
