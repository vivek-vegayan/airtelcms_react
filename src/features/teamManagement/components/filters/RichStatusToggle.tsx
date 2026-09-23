import { Box, Typography } from "@mui/material";
import SwapHorizontalCircleIcon from "@mui/icons-material/SwapHorizontalCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

export const RichStatusToggle = ({
  status,
  setStatus,
  activeCount = 0,
  inactiveCount = 0,
}: {
  status: "ACTIVE" | "INACTIVE";
  setStatus: (s: "ACTIVE" | "INACTIVE") => void;
  activeCount?: number;
  inactiveCount?: number;
}) => {
  const isActive = status === "ACTIVE";
  const count = isActive ? activeCount : inactiveCount;

  // Clean conditional variables
  const colors = isActive
    ? { bg: "#EAF3DE", border: "#97C459", dark: "#27500A", light: "#EAF3DE" }
    : { bg: "#FAECE7", border: "#F0997B", dark: "#993C1D", light: "#FAECE7" };

  return (
    <Box
      onClick={() => setStatus(isActive ? "INACTIVE" : "ACTIVE")}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        p: "3px 10px 3px 3px", // Tighter padding, hugging the left circle
        borderRadius: "100px",
        cursor: "pointer",
        userSelect: "none",
        border: "1px solid",
        borderColor: colors.border,
        bgcolor: colors.bg,
        transition: "all .2s",
        height: "30px", // Strict compact height
      }}
    >
      {/* Icon Circle */}
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: colors.dark,
        }}
      >
        {isActive ? (
          <CheckCircleIcon sx={{ fontSize: 14, color: colors.light }} />
        ) : (
          <CloseIcon sx={{ fontSize: 14, color: colors.light }} />
        )}
      </Box>

      {/* Flattened Single-Line Text */}
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>
        {isActive ? "Active" : "Inactive"}
        <Typography
          component="span"
          sx={{ fontSize: 12, fontWeight: 400, opacity: 0.8, ml: 0.5 }}
        >
          {/* ({count}) */}
        </Typography>
      </Typography>

      <SwapHorizontalCircleIcon
        sx={{ fontSize: 16, color: colors.dark, opacity: 0.6 }}
      />
    </Box>
  );
};

// import { Box, Typography } from "@mui/material";
// import SwapHorizontalCircleIcon from "@mui/icons-material/SwapHorizontalCircle";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import CloseIcon from "@mui/icons-material/Close";
// export const RichStatusToggle = ({
//   status,
//   setStatus,
//   activeCount = 0,
//   inactiveCount = 0,
// }: {
//   status: "ACTIVE" | "INACTIVE";
//   setStatus: (s: "ACTIVE" | "INACTIVE") => void;
//   activeCount?: number;
//   inactiveCount?: number;
// }) => {
//   const isActive = status === "ACTIVE";
//   const toggle = () => setStatus(isActive ? "INACTIVE" : "ACTIVE");

//   return (
//     <Box
//       onClick={toggle}
//       sx={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: "10px",
//         // pl: "10px", pr: "14px", py: "7px",
//         p: "2px 10px 2px 14px",
//         borderRadius: "100px",
//         cursor: "pointer",
//         border: "1.5px solid",
//         transition: "all .2s",
//         userSelect: "none",
//         ...(isActive
//           ? { bgcolor: "#EAF3DE", borderColor: "#97C459" }
//           : { bgcolor: "#FAECE7", borderColor: "#F0997B" }),
//       }}
//     >
//       {/* Icon circle */}
//       <Box
//         sx={{
//           width: 28,
//           height: 28,
//           borderRadius: "50%",
//           flexShrink: 0,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           bgcolor: isActive ? "#27500A" : "#993C1D",
//           transition: "background .2s",
//         }}
//       >
//         {isActive ? (
//           <CheckCircleIcon sx={{ fontSize: 14, color: "#EAF3DE" }} />
//         ) : (
//           <CloseIcon sx={{ fontSize: 14, color: "#FAECE7" }} />
//         )}
//       </Box>

//       {/* Text */}
//       <Box>
//         <Typography
//           sx={{
//             fontSize: 13,
//             fontWeight: 500,
//             lineHeight: 1.2,
//             color: isActive ? "#27500A" : "#712B13",
//           }}
//         >
//           {isActive ? "Active members" : "Inactive members"}
//         </Typography>
//         <Typography
//           sx={{
//             fontSize: 10,
//             lineHeight: 1.2,
//             color: isActive ? "#3B6D11" : "#993C1D",
//             opacity: 0.75,
//           }}
//         >
//           {isActive ? activeCount : inactiveCount} employees · click to switch
//         </Typography>
//       </Box>

//       {/* Swap icon */}
//       <SwapHorizontalCircleIcon
//         sx={{
//           fontSize: 16,
//           color: isActive ? "#3B6D11" : "#993C1D",
//           opacity: 0.6,
//           ml: "2px",
//         }}
//       />
//     </Box>
//   );
// };
