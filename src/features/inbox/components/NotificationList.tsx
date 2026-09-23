import {
  alpha,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { InboxItem } from "./TaskInbox";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { AppScrollView } from "../../../components/ui/AppScrollView";

export const NotificationList = ({
  filterTab,
  setFilterTab,
  searchQuery,
  setSearchQuery,
  filteredData,
  isLoading,
  isFetching,
  selectedItemId,
  setSelectedItemId,
  onOpenMenu,
  activeMenuName,
}: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <>
      {/* Header row */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px: 1.5,
          pt: 1,
          pb: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 44,
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          sx={{ display: { xs: "flex", md: "none" }, mr: 0.5 }}
          onClick={onOpenMenu}
          edge="start"
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Typography variant="body2">{activeMenuName}</Typography>

        <Tabs
          value={filterTab}
          onChange={(_, v) => setFilterTab(v)}
          sx={{
            minHeight: 40,
            flex: { xs: 0, md: 1 },
            "& .MuiTab-root": {
              textTransform: "none",
              minWidth: "auto",
              px: 1.5,
              py: 1,
              minHeight: 40,
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "text.secondary",
              "&.Mui-selected": { fontWeight: 700, color: "primary.main" },
            },
            "& .MuiTabs-indicator": {
              height: 2,
              borderRadius: "2px 2px 0 0",
            },
          }}
        >
          <Tab label="All" />
          <Tab label="Unread" />
        </Tabs>
      </Stack>

      {/* Search */}
      <Box sx={{ px: 1.5, py: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={`Search ${activeMenuName.toLowerCase()}…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              fontSize: "0.8125rem",
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.04)
                : alpha(theme.palette.common.black, 0.03),
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: theme.palette.divider },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                borderWidth: 1,
              },
            },
            "& .MuiInputBase-input": { py: 0.875 },
          }}
        />
      </Box>

      {/* Loading bar */}
      {(isLoading || isFetching) && <LinearProgress sx={{ height: 1.5 }} />}

      {/* List */}
      <AppScrollView
        sx={{
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: alpha(theme.palette.text.secondary, 0.35),
          },
        }}
      >
        {filteredData.length === 0 && !isLoading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 6, px: 2, gap: 0.75 }}
          >
            <Typography
              fontSize="0.8125rem"
              color="text.disabled"
              textAlign="center"
            >
              No items in <strong>{activeMenuName}</strong>
            </Typography>
          </Stack>
        )}

        {filteredData.map((item: InboxItem) => {
          const isSelected = item.id === selectedItemId;
          const previewText =
            item.message.replace(/\n/g, " ").substring(0, 72) + "…";

          return (
            <Box
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              sx={{
                px: 1.5,
                py: 1.25,
                cursor: "pointer",
                borderBottom: `1px solid ${theme.palette.divider}`,

                // ── Left accent bar ──
                // Unread items get a faint hint; selected gets the solid primary bar
                borderLeft: `3px solid ${
                  isSelected
                    ? theme.palette.primary.main
                    : item.isUnread
                      ? alpha(theme.palette.primary.main, 0.3)
                      : "transparent"
                }`,

                // ── Background ──
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05)
                  : "transparent",

                transition:
                  "background-color 0.15s ease, border-color 0.15s ease",

                // ── Hover ──
                "&:hover": {
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)
                    : isDark
                      ? alpha(theme.palette.common.white, 0.04)
                      : alpha(theme.palette.common.black, 0.025),
                },
              }}
            >
              {/* Title row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={0.375}
                gap={1}
              >
                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: item.isUnread ? 700 : 500,
                    // Tint title with primary color when selected
                    color: isSelected ? "primary.main" : "text.primary",
                    lineHeight: 1.35,
                    flex: 1,
                    transition: "color 0.15s ease",
                  }}
                >
                  {item.shortTitle}
                </Typography>

                {/* Unread dot — swaps to a filled check circle when selected */}
                {isSelected ? (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      flexShrink: 0,
                      mt: 0.125,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 9 9"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.5 4.5L3.5 6.5L7.5 2.5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Box>
                ) : (
                  item.isUnread && (
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    />
                  )
                )}
              </Stack>

              {/* Preview */}
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  // Slightly brighter when selected so it reads clearly
                  color: isSelected ? "text.primary" : "text.secondary",
                  lineHeight: 1.4,
                  mb: 0.875,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  transition: "color 0.15s ease",
                }}
              >
                {previewText}
              </Typography>

              {/* Meta row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "text.disabled",
                    fontWeight: 500,
                  }}
                >
                  {item.date} · {item.time}
                </Typography>
                <Chip
                  label={item.isActionable ? "Action Required" : item.status}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    borderRadius: "4px",
                    bgcolor: item.isActionable
                      ? alpha(theme.palette.warning.main, isDark ? 0.18 : 0.1)
                      : alpha(theme.palette.success.main, isDark ? 0.18 : 0.1),
                    color: item.isActionable
                      ? isDark
                        ? "warning.light"
                        : "warning.dark"
                      : isDark
                        ? "success.light"
                        : "success.dark",
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              </Stack>
            </Box>
          );
        })}
      </AppScrollView>
    </>
  );
};

// import {
//   alpha,
//   Box,
//   Chip,
//   IconButton,
//   InputAdornment,
//   LinearProgress,
//   Stack,
//   Tab,
//   Tabs,
//   TextField,
//   Typography,
//   useTheme,
// } from "@mui/material";
// import type { InboxItem } from "./TaskInbox";
// import MenuIcon from "@mui/icons-material/Menu";
// import SearchIcon from "@mui/icons-material/Search";
// import { AppScrollView } from "../../../components/ui/AppScrollView";

// export const NotificationList = ({
//   filterTab,
//   setFilterTab,
//   searchQuery,
//   setSearchQuery,
//   filteredData,
//   isLoading,
//   selectedItemId,
//   setSelectedItemId,
//   onOpenMenu,
//   activeMenuName,
// }: any) => {
//   const theme = useTheme();
//   const isDark = theme.palette.mode === "dark";

//   return (
//     <>
//       {/* Header row */}
//       <Stack
//         direction="row"
//         alignItems="center"
//         sx={{
//           px: 1.5,
//           pt: 1,
//           pb: 0,
//           borderBottom: `1px solid ${theme.palette.divider}`,
//           minHeight: 44,
//           gap: 0.5,
//         }}
//       >
//         <IconButton
//           size="small"
//           sx={{ display: { xs: "flex", md: "none" }, mr: 0.5 }}
//           onClick={onOpenMenu}
//           edge="start"
//         >
//           <MenuIcon fontSize="small" />
//         </IconButton>

//         <Typography
//           variant="body2"
//           // sx={{
//           //   fontWeight: 700,
//           //   flex: 1,
//           //   fontSize: "0.8125rem",
//           //   display: { xs: "block", md: "none" },
//           //   color: "text.primary",
//           //   noWrap: true,
//           // }}
//         >
//           {activeMenuName}
//         </Typography>

//         <Tabs
//           value={filterTab}
//           onChange={(_, v) => setFilterTab(v)}
//           sx={{
//             minHeight: 40,
//             flex: { xs: 0, md: 1 },
//             "& .MuiTab-root": {
//               textTransform: "none",
//               minWidth: "auto",
//               px: 1.5,
//               py: 1,
//               minHeight: 40,
//               fontSize: "0.8125rem",
//               fontWeight: 500,
//               color: "text.secondary",
//               "&.Mui-selected": { fontWeight: 700, color: "primary.main" },
//             },
//             "& .MuiTabs-indicator": {
//               height: 2,
//               borderRadius: "2px 2px 0 0",
//             },
//           }}
//         >
//           <Tab label="All" />
//           <Tab label="Unread" />
//         </Tabs>
//       </Stack>

//       {/* Search */}
//       <Box sx={{ px: 1.5, py: 1 }}>
//         <TextField
//           fullWidth
//           size="small"
//           placeholder={`Search ${activeMenuName.toLowerCase()}…`}
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
//               </InputAdornment>
//             ),
//           }}
//           sx={{
//             "& .MuiOutlinedInput-root": {
//               borderRadius: "8px",
//               fontSize: "0.8125rem",
//               bgcolor: isDark
//                 ? alpha(theme.palette.common.white, 0.04)
//                 : alpha(theme.palette.common.black, 0.03),
//               "& fieldset": { borderColor: "transparent" },
//               "&:hover fieldset": { borderColor: theme.palette.divider },
//               "&.Mui-focused fieldset": {
//                 borderColor: theme.palette.primary.main,
//                 borderWidth: 1,
//               },
//             },
//             "& .MuiInputBase-input": { py: 0.875 },
//           }}
//         />
//       </Box>

//       {/* Loading bar */}
//       {isLoading && <LinearProgress sx={{ height: 1.5 }} />}

//       {/* List */}
//       <AppScrollView
//         sx={{
//           flex: 1,
//           overflowY: "auto",
//           "&::-webkit-scrollbar": { width: 4 },
//           "&::-webkit-scrollbar-track": { background: "transparent" },
//           "&::-webkit-scrollbar-thumb": {
//             background: alpha(theme.palette.text.secondary, 0.2),
//             borderRadius: 4,
//           },
//           "&::-webkit-scrollbar-thumb:hover": {
//             background: alpha(theme.palette.text.secondary, 0.35),
//           },
//         }}
//       >
//         {filteredData.length === 0 && !isLoading && (
//           <Stack
//             alignItems="center"
//             justifyContent="center"
//             sx={{ mt: 6, px: 2, gap: 0.75 }}
//           >
//             <Typography
//               fontSize="0.8125rem"
//               color="text.disabled"
//               textAlign="center"
//             >
//               No items in <strong>{activeMenuName}</strong>
//             </Typography>
//           </Stack>
//         )}

//         {filteredData.map((item: InboxItem) => {
//           const isSelected = item.id === selectedItemId;
//           const previewText =
//             item.message.replace(/\n/g, " ").substring(0, 72) + "…";

//           return (
//             <Box
//               key={item.id}
//               onClick={() => setSelectedItemId(item.id)}
//               sx={{
//                 px: 1.5,
//                 py: 1.25,
//                 cursor: "pointer",
//                 borderBottom: `1px solid ${theme.palette.divider}`,
//                 borderLeft: `3px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
//                 bgcolor: isSelected
//                   ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.04)
//                   : "transparent",
//                 transition:
//                   "background-color 0.12s ease, border-color 0.12s ease",
//                 // "&:hover": {
//                 //   bgcolor: isSelected
//                 //     ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.05)
//                 //     : alpha(theme.palette.action.hover, 1),
//                 // },
//               }}
//             >
//               {/* Title row */}
//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//                 alignItems="flex-start"
//                 mb={0.375}
//                 gap={1}
//               >
//                 <Typography
//                   sx={{
//                     fontSize: "0.8125rem",
//                     fontWeight: item.isUnread ? 700 : 500,
//                     color: "text.primary",
//                     lineHeight: 1.35,
//                     flex: 1,
//                   }}
//                 >
//                   {item.shortTitle}
//                 </Typography>
//                 {item.isUnread && (
//                   <Box
//                     sx={{
//                       width: 7,
//                       height: 7,
//                       borderRadius: "50%",
//                       bgcolor: "primary.main",
//                       flexShrink: 0,
//                       mt: 0.5,
//                     }}
//                   />
//                 )}
//               </Stack>

//               {/* Preview */}
//               <Typography
//                 sx={{
//                   fontSize: "0.75rem",
//                   color: "text.secondary",
//                   lineHeight: 1.4,
//                   mb: 0.875,
//                   display: "-webkit-box",
//                   WebkitLineClamp: 2,
//                   WebkitBoxOrient: "vertical",
//                   overflow: "hidden",
//                 }}
//               >
//                 {previewText}
//               </Typography>

//               {/* Meta row */}
//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//                 alignItems="center"
//               >
//                 <Typography
//                   sx={{
//                     fontSize: "0.7rem",
//                     color: "text.disabled",
//                     fontWeight: 500,
//                   }}
//                 >
//                   {item.date} · {item.time}
//                 </Typography>
//                 <Chip
//                   label={item.isActionable ? "Action Required" : item.status}
//                   size="small"
//                   sx={{
//                     height: 18,
//                     fontSize: "0.6rem",
//                     fontWeight: 700,
//                     letterSpacing: "0.04em",
//                     textTransform: "uppercase",
//                     borderRadius: "4px",
//                     bgcolor: item.isActionable
//                       ? alpha(theme.palette.warning.main, isDark ? 0.18 : 0.1)
//                       : alpha(theme.palette.success.main, isDark ? 0.18 : 0.1),
//                     color: item.isActionable
//                       ? isDark
//                         ? "warning.light"
//                         : "warning.dark"
//                       : isDark
//                         ? "success.light"
//                         : "success.dark",
//                     "& .MuiChip-label": { px: 0.75 },
//                   }}
//                 />
//               </Stack>
//             </Box>
//           );
//         })}
//       </AppScrollView>
//     </>
//   );
// };

// import {
//   alpha,
//   Box,
//   Chip,
//   IconButton,
//   InputAdornment,
//   LinearProgress,
//   Stack,
//   Tab,
//   Tabs,
//   TextField,
//   Typography,
//   useTheme,
// } from "@mui/material";
// import type { InboxItem } from "./TaskInbox";
// import MenuIcon from "@mui/icons-material/Menu";
// import SearchIcon from "@mui/icons-material/Search";
// import { AppScrollView } from "../../../components/ui/AppScrollView";

// // --- Middle List Panel ---
// export const NotificationList = ({
//   filterTab,
//   setFilterTab,
//   searchQuery,
//   setSearchQuery,
//   filteredData,
//   isLoading,
//   selectedItemId,
//   setSelectedItemId,
//   onOpenMenu,
//   activeMenuName,
// }: any) => {
//   const theme = useTheme();

//   return (
//     <>
//       <Stack
//         direction="row"
//         alignItems="center"
//         sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1, pb: 0.5 }}
//       >
//         <IconButton
//           sx={{ display: { xs: "block", md: "none" }, mr: 1 }}
//           onClick={onOpenMenu}
//           edge="start"
//         >
//           <MenuIcon />
//         </IconButton>
//         <Typography
//           variant="subtitle1"
//           sx={{
//             fontWeight: 700,
//             flex: 1,
//             display: { xs: "block", md: "none" },
//           }}
//         >
//           {activeMenuName}
//         </Typography>
//         <Tabs
//           value={filterTab}
//           onChange={(_, v) => setFilterTab(v)}
//           sx={{
//             minHeight: 40,
//             flex: { xs: 0, md: 1 },
//             "& .MuiTab-root": {
//               textTransform: "none",
//               minWidth: "auto",
//               px: 2,
//               fontWeight: 600,
//               fontSize: "0.875rem",
//             },
//             "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
//           }}
//         >
//           <Tab label="All" />
//           <Tab label="Unread" />
//         </Tabs>
//       </Stack>

//       <Box sx={{ p: 1 }}>
//         <TextField
//           fullWidth
//           size="small"
//           placeholder={`Search ${activeMenuName.toLowerCase()}...`}
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <SearchIcon fontSize="small" />
//               </InputAdornment>
//             ),
//           }}
//           sx={{
//             "& .MuiOutlinedInput-root": {
//               borderRadius: 2,
//               bgcolor: "background.paper",
//             },
//           }}
//         />
//       </Box>

//       <AppScrollView
//         sx={{
//           flex: 1,
//           overflowY: "auto",

//           "&::-webkit-scrollbar": { width: "6px" },
//           "&::-webkit-scrollbar-track": { background: "transparent" },
//           "&::-webkit-scrollbar-thumb": {
//             background: alpha(theme.palette.text.secondary, 0.3),
//             borderRadius: "10px",
//           },
//           "&::-webkit-scrollbar-thumb:hover": {
//             background: alpha(theme.palette.text.secondary, 0.5),
//           },
//         }}
//       >
//         {isLoading && <LinearProgress sx={{ height: 2 }} />}

//         {filteredData.length === 0 && !isLoading && (
//           <Typography
//             textAlign="center"
//             color="text.secondary"
//             sx={{ mt: 4, fontSize: 14 }}
//           >
//             No matching items found in {activeMenuName}.
//           </Typography>
//         )}

//         {filteredData.map((item: InboxItem) => {
//           const isSelected = item.id === selectedItemId;
//           const previewText =
//             item.message.replace(/\n/g, " ").substring(0, 60) + "...";

//           return (
//             <Box
//               key={item.id}
//               onClick={() => setSelectedItemId(item.id)}
//               sx={{
//                 backgroundColor: "red",
//                 p: 1.5,
//                 cursor: "pointer",
//                 borderBottom: `1px solid ${theme.palette.divider}`,
//                 bgcolor: isSelected
//                   ? alpha(theme.palette.primary.main, 0.04)
//                   : "transparent",
//                 borderLeft: `4px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
//                 transition: "all 0.2s ease",
//                 "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.02) },
//               }}
//             >
//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//                 alignItems="flex-start"
//                 mb={0.5}
//               >
//                 <Typography
//                   variant="subtitle2"
//                   sx={{
//                     fontWeight: item.isUnread ? 700 : 500,
//                     color: "text.primary",
//                   }}
//                 >
//                   {item.shortTitle}
//                 </Typography>
//                 {item.isUnread && (
//                   <Box
//                     sx={{
//                       width: 8,
//                       height: 8,
//                       borderRadius: "50%",
//                       bgcolor: "primary.main",
//                       mt: 0.5,
//                       flexShrink: 0,
//                     }}
//                   />
//                 )}
//               </Stack>

//               <Typography
//                 variant="body2"
//                 sx={{
//                   color: "text.secondary",
//                   mb: 1.5,
//                   fontSize: "0.8rem",
//                   lineHeight: 1.4,
//                 }}
//               >
//                 {previewText}
//               </Typography>

//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//                 alignItems="center"
//               >
//                 <Typography
//                   variant="caption"
//                   sx={{ color: "text.secondary", fontWeight: 500 }}
//                 >
//                   {item.date} • {item.time}
//                 </Typography>
//                 <Chip
//                   label={item.isActionable ? "Action Required" : item.status}
//                   size="small"
//                   sx={{
//                     height: 20,
//                     fontSize: "0.65rem",
//                     fontWeight: 700,
//                     borderRadius: 1,
//                     textTransform: "uppercase",
//                     bgcolor: item.isActionable
//                       ? alpha(theme.palette.warning.main, 0.1)
//                       : alpha(theme.palette.success.main, 0.1),
//                     color: item.isActionable ? "warning.dark" : "success.dark",
//                   }}
//                 />
//               </Stack>
//             </Box>
//           );
//         })}
//       </AppScrollView>
//     </>
//   );
// };
