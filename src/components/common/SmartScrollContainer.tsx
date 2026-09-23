// SmartScrollContainer.tsx
import { Box, IconButton, useTheme } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  height?: number | string;
  /** Fill the parent flex container's remaining space instead of capping at
   * a fixed `height` - for panels whose available height varies (a drawer,
   * a dialog) rather than ones with a known pixel/viewport size. The parent
   * must itself be a flex column with a definite height for this to work. */
  fill?: boolean;
  enableHorizontal?: boolean;
  children: React.ReactNode;
}

const SmartScrollContainer = ({
  height = 300,
  fill = false,
  enableHorizontal = false,
  children,
}: Props) => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setShowTop(el.scrollTop > 8);
    setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 8);

    if (enableHorizontal) {
      setShowLeft(el.scrollLeft > 8);
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    }
  }, [enableHorizontal]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [checkScroll]);

  const scroll = (direction: "up" | "down" | "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 150;
    el.scrollBy({
      top: direction === "up" ? -amount : direction === "down" ? amount : 0,
      left: direction === "left" ? -amount : direction === "right" ? amount : 0,
      behavior: "smooth",
    });
  };

  const isDark = theme.palette.mode === "dark";
  const fadeBase = isDark
    ? theme.palette.background.default
    : theme.palette.background.paper;

  // Pill button shared styles
  const pillBtn = {
    position: "absolute" as const,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
    bgcolor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)",
    backdropFilter: "blur(6px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)"}`,
    color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)",
    borderRadius: "20px",
    width: 28,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      bgcolor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.13)",
      color: isDark ? "#fff" : "#000",
    },
    transition: "all 0.2s ease",
    "& svg": { fontSize: 15 },
  };

  return (
    <Box
      position="relative"
      sx={fill ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : undefined}
    >
      <Box
        ref={scrollRef}
        onScroll={checkScroll}
        sx={{
          ...(fill ? { flex: 1, minHeight: 0 } : { maxHeight: height }),
          overflowY: "auto",
          overflowX: enableHorizontal ? "auto" : "hidden",
          pr: 0.5,
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": { width: 4, height: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)",
            borderRadius: 10,
          },
          "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        }}
      >
        {children}
      </Box>

      {/* Vertical fades */}
      {showTop && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            background: `linear-gradient(to bottom, ${fadeBase} 10%, transparent)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
      {showBottom && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: `linear-gradient(to top, ${fadeBase} 10%, transparent)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Vertical scroll buttons — centered, pill style */}
      {showTop && (
        <IconButton
          size="small"
          onClick={() => scroll("up")}
          sx={{ ...pillBtn, top: 4 }}
        >
          <KeyboardArrowUpIcon />
        </IconButton>
      )}
      {showBottom && (
        <IconButton
          size="small"
          onClick={() => scroll("down")}
          sx={{ ...pillBtn, bottom: 4 }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )}

      {/* Horizontal buttons */}
      {enableHorizontal && showLeft && (
        <IconButton
          size="small"
          onClick={() => scroll("left")}
          sx={{
            ...pillBtn,
            left: 8,
            transform: "none",
            bottom: 8,
            borderRadius: "20px",
            width: 20,
            height: 28,
          }}
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
      )}
      {enableHorizontal && showRight && (
        <IconButton
          size="small"
          onClick={() => scroll("right")}
          sx={{
            ...pillBtn,
            right: 8,
            left: "auto",
            transform: "none",
            bottom: 8,
            borderRadius: "20px",
            width: 20,
            height: 28,
          }}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default SmartScrollContainer;

// import { Box, IconButton, useTheme } from "@mui/material";
// import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
// import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
// import { useRef, useState, useEffect, useCallback } from "react";

// interface Props {
//   height?: number;
//   enableHorizontal?: boolean;
//   children: React.ReactNode;
// }

// const SmartScrollContainer = ({
//   height = 300,
//   enableHorizontal = false,
//   children,
// }: Props) => {
//   const theme = useTheme();
//   const scrollRef = useRef<HTMLDivElement>(null);

//   const [showTop, setShowTop] = useState(false);
//   const [showBottom, setShowBottom] = useState(false);
//   const [showLeft, setShowLeft] = useState(false);
//   const [showRight, setShowRight] = useState(false);

//   const checkScroll = useCallback(() => {
//     const el = scrollRef.current;
//     if (!el) return;

//     setShowTop(el.scrollTop > 8);
//     setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 8);

//     if (enableHorizontal) {
//       setShowLeft(el.scrollLeft > 8);
//       setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
//     }
//   }, [enableHorizontal]);

//   useEffect(() => {
//     checkScroll();

//     const el = scrollRef.current;
//     if (!el) return;

//     const resizeObserver = new ResizeObserver(() => {
//       checkScroll();
//     });

//     resizeObserver.observe(el);

//     return () => {
//       resizeObserver.disconnect();
//     };
//   }, [checkScroll]);

//   const scroll = (direction: "up" | "down" | "left" | "right") => {
//     const el = scrollRef.current;
//     if (!el) return;

//     const amount = 150;

//     el.scrollBy({
//       top: direction === "up" ? -amount : direction === "down" ? amount : 0,
//       left: direction === "left" ? -amount : direction === "right" ? amount : 0,
//       behavior: "smooth",
//     });
//   };

//   const fadeColor =
//     theme.palette.mode === "dark"
//       ? theme.palette.background.default
//       : theme.palette.background.paper;

//   return (
//     <Box position="relative">
//       <Box
//         ref={scrollRef}
//         onScroll={checkScroll}
//         sx={{
//           maxHeight: height,
//           overflowY: "auto",
//           overflowX: enableHorizontal ? "auto" : "hidden",
//           pr: 1,
//           scrollBehavior: "smooth",

//           /* Modern Scrollbar */
//           "&::-webkit-scrollbar": {
//             width: 6,
//             height: 6,
//           },
//           "&::-webkit-scrollbar-thumb": {
//             backgroundColor: theme.palette.divider,
//             borderRadius: 10,
//           },
//           "&::-webkit-scrollbar-track": {
//             backgroundColor: "transparent",
//           },
//         }}
//       >
//         {children}
//       </Box>

//       {/* ===== Vertical Fades ===== */}

//       {showTop && (
//         <Box
//           sx={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             right: 0,
//             height: 30,
//             background: `linear-gradient(to bottom, ${fadeColor}, transparent)`,
//             pointerEvents: "none",
//           }}
//         />
//       )}

//       {showBottom && (
//         <Box
//           sx={{
//             position: "absolute",
//             bottom: 0,
//             left: 0,
//             right: 0,
//             height: 30,
//             background: `linear-gradient(to top, ${fadeColor}, transparent)`,
//             pointerEvents: "none",
//           }}
//         />
//       )}

//       {/* ===== Vertical Buttons ===== */}

//       {showTop && (
//         <IconButton
//           size="small"
//           onClick={() => scroll("up")}
//           sx={{
//             position: "absolute",
//             right: 8,
//             top: 8,
//             bgcolor: "background.paper",
//             boxShadow: 3,
//           }}
//         >
//           <KeyboardArrowUpIcon fontSize="small" />
//         </IconButton>
//       )}

//       {showBottom && (
//         <IconButton
//           size="small"
//           onClick={() => scroll("down")}
//           sx={{
//             position: "absolute",
//             right: 8,
//             bottom: 8,
//             bgcolor: "background.paper",
//             boxShadow: 3,
//           }}
//         >
//           <KeyboardArrowDownIcon fontSize="small" />
//         </IconButton>
//       )}

//       {/* ===== Horizontal Buttons ===== */}

//       {enableHorizontal && showLeft && (
//         <IconButton
//           size="small"
//           onClick={() => scroll("left")}
//           sx={{
//             position: "absolute",
//             left: 8,
//             bottom: 8,
//             bgcolor: "background.paper",
//             boxShadow: 3,
//           }}
//         >
//           <KeyboardArrowLeftIcon fontSize="small" />
//         </IconButton>
//       )}

//       {enableHorizontal && showRight && (
//         <IconButton
//           size="small"
//           onClick={() => scroll("right")}
//           sx={{
//             position: "absolute",
//             right: 8,
//             bottom: 8,
//             bgcolor: "background.paper",
//             boxShadow: 3,
//           }}
//         >
//           <KeyboardArrowRightIcon fontSize="small" />
//         </IconButton>
//       )}
//     </Box>
//   );
// };

// export default SmartScrollContainer;
