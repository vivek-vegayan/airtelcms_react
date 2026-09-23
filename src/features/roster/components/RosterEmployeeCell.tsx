import { memo } from "react";
import {
  TableCell,
  Stack,
  Avatar,
  Typography,
  Box,
  useTheme,
} from "@mui/material";

/* ─── TEMP: dummy name generator ─────────────────────────────────────────
   Remove this block once the API returns a real `user.name` field.
   Deterministically derives a consistent fake name from olmid/userId so
   the same employee always shows the same name (no flicker on refetch). */
// const DUMMY_FIRST_NAMES = [
//   "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun",
//   "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan",
//   "Ananya", "Diya", "Priya", "Kavya", "Saanvi",
// ];

// const DUMMY_LAST_NAMES = [
//   "Sharma", "Verma", "Gupta", "Mehta", "Patel",
//   "Nair", "Iyer", "Reddy", "Singh", "Kapoor",
// ];

// const hashSeed = (str: string) => {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     hash = (hash << 5) - hash + str.charCodeAt(i);
//     hash |= 0;
//   }
//   return Math.abs(hash);
// };

// const getDummyName = (seed: string) => {
//   const h = hashSeed(seed || "user");
//   const first = DUMMY_FIRST_NAMES[h % DUMMY_FIRST_NAMES.length];
//   const last =
//     DUMMY_LAST_NAMES[Math.floor(h / DUMMY_FIRST_NAMES.length) % DUMMY_LAST_NAMES.length];
//   return `${first} ${last}`;
// };
/* ────────────────────────────────────────────────────────────────────── */

const getInitials = (name: string) =>
  name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "??";

export const RosterEmployeeCell = memo(function RosterEmployeeCell({
  user,
}: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  // Once the API adds `user.name`, this will pick it up automatically —
  // until then it falls back to the deterministic dummy name above.
  // const displayName = user?.name || getDummyName(user?.olmid || user?.userId);

  return (
    <TableCell
      sx={{
        width: 190,
        minWidth: 190,
        position: "sticky",
        left: 0,
        zIndex: 20,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${CELL_BORDER}`,
        borderRight: `1px solid ${CELL_BORDER}`,
        py: "5px",
        px: "10px",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          sx={{
            width: 28,
            height: 28,
            fontSize: 11,
          }}
        >
          {getInitials(user.employeeName)}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography fontSize="0.75rem" fontWeight={700} noWrap>
            {user.employeeName}
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography fontSize="0.65rem" color="text.secondary" noWrap>
              {user.olmid}
            </Typography>
            <Box
              sx={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                bgcolor: "text.disabled",
                flexShrink: 0,
              }}
            />
            <Typography fontSize="0.65rem" color="text.secondary" noWrap>
              {user.jobLevel}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </TableCell>
  );
});
