import { Box, Stack, Typography, Skeleton } from "@mui/material";
import { useGetCurrentShiftCountQuery } from "../api/rosterApiSlice";
import { getShiftCountColor } from "../utils/shiftCountColor";

interface Props {
  domainId?: number;
  subDomainId?: number;
}

export const CompactShiftCountBar = ({ domainId, subDomainId }: Props) => {
  const shouldSkip = !domainId || subDomainId == null;

  const { data = [], isLoading } = useGetCurrentShiftCountQuery(
    { domainId: domainId ?? 0, subDomainId: subDomainId ?? 0 },
    { skip: shouldSkip },
  );

  if (shouldSkip) return null;

  if (isLoading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rounded" width={56} height={24} sx={{ borderRadius: "8px" }} />
        ))}
      </Stack>
    );
  }

  if (!data.length) return null;

  // Separate total from the rest
  const regularItems = data.filter(
    item => item.shiftName?.toUpperCase() !== "TOTAL COUNT"
  );
  const totalItem = data.find(
    item => item.shiftName?.toUpperCase() === "TOTAL COUNT"
  );

  return (
    <Box sx={{ px: 0.5, py: 0.25, overflowX: "auto" }}>
      <Stack direction="row" spacing={0.75} alignItems="center">

        {/* Regular shift pills */}
        {regularItems.map(item => {
          const c = getShiftCountColor(item.shiftName);
          const count = Number(item.totalUsers);

          return (
            <Box
              key={item.shiftName}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                height: 24,
                pl: "5px",
                pr: "8px",
                borderRadius: "8px",
                border: `1px solid ${c.border}`,
                bgcolor: c.bg,
                transition: "transform .12s ease, box-shadow .12s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: `0 2px 8px ${c.badge}33`,
                },
              }}
            >
              {/* Colored left badge dot */}
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "4px",
                  bgcolor: c.badge,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "8px",
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1,
                    letterSpacing: item.shiftName.length > 1 ? "-.4px" : 0,
                  }}
                >
                  {item.shiftName}
                </Typography>
              </Box>

              {/* Count */}
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: c.text,
                  lineHeight: 1,
                  minWidth: 12,
                  textAlign: "center",
                }}
              >
                {count}
              </Typography>
            </Box>
          );
        })}

        {/* Divider before total */}
        {totalItem && (
          <>
            <Box sx={{
              width: "1px", height: 18,
              bgcolor: "divider",
              flexShrink: 0,
            }} />

            {/* Total pill — slightly larger, stands out */}
            {(() => {
              const c = getShiftCountColor("TOTAL COUNT");
              const count = Number(totalItem.totalUsers);
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    height: 24,
                    pl: "5px",
                    pr: "9px",
                    borderRadius: "8px",
                    border: `1px solid ${c.border}`,
                    bgcolor: c.bg,
                    transition: "transform .12s ease, box-shadow .12s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: `0 2px 8px ${c.badge}33`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "4px",
                      bgcolor: c.badge,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{
                      fontSize: "7px",
                      fontWeight: 800,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-.3px",
                    }}>
                      Σ
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: c.text,
                    lineHeight: 1,
                    minWidth: 12,
                    textAlign: "center",
                  }}>
                    {count}
                  </Typography>
                </Box>
              );
            })()}
          </>
        )}
      </Stack>
    </Box>
  );
};