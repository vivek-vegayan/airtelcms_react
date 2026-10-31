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
import { InboxEmptyState } from "./InboxEmptyState";
import { AppScrollView } from "../../../components/ui/AppScrollView";
import { getModuleIcon } from "../utils/getModuleIcon";
import { formatRelativeTime, getDateGroup } from "../utils/formatRelativeTime";

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

        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap" }}>
          {activeMenuName}
          <Box component="span" sx={{ ml: 0.75, fontWeight: 500, color: "text.secondary" }}>
            {filteredData.length}
          </Box>
        </Typography>

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
          <InboxEmptyState
            subtitle={
              activeMenuName === "Action Required"
                ? "No pending requests right now. New approvals will appear here."
                : `No notifications in ${activeMenuName} right now.`
            }
          />
        )}

        {filteredData.map((item: InboxItem, index: number) => {
          const isSelected = item.id === selectedItemId;
          const previewText =
            item.message.replace(/\n/g, " ").substring(0, 72) + "…";
          // Section header whenever the date group changes; list order is untouched.
          const group = getDateGroup(item.originalData.createdAt);
          const showGroup =
            index === 0 ||
            getDateGroup(filteredData[index - 1].originalData.createdAt) !== group;
          const needsAction = item.isActionable && !item.isDone;

          return (
            <Box key={item.id}>
            {showGroup && (
              <Typography
                sx={{
                  px: 2,
                  pt: index === 0 ? 1.25 : 2,
                  pb: 0.75,
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                {group}
              </Typography>
            )}
            <Box
              onClick={() => setSelectedItemId(item.id)}
              sx={{
                px: 1.75,
                py: 1.5,
                cursor: "pointer",
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
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
                  : item.isDone
                    ? alpha(theme.palette.text.primary, isDark ? 0.03 : 0.02)
                    : "transparent",

                // ── Done (completed / already read) items are greyed out ──
                opacity: item.isDone && !isSelected ? 0.6 : 1,
                filter: item.isDone && !isSelected ? "grayscale(1)" : "none",

                transition:
                  "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",

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
              {/* Module icon tile */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "9px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(
                    needsAction ? theme.palette.warning.main : theme.palette.primary.main,
                    isDark ? 0.18 : 0.1,
                  ),
                  color: needsAction
                    ? isDark
                      ? "warning.light"
                      : "warning.dark"
                    : "primary.main",
                  "& svg": { fontSize: 18 },
                }}
              >
                {getModuleIcon(item.displayModule)}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Title row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                mb={0.375}
                gap={1}
              >
                <Typography
                  noWrap
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: item.isUnread ? 700 : 500,
                    // Tint title with primary color when selected
                    color: isSelected ? "primary.main" : "text.primary",
                    lineHeight: 1.35,
                    flex: 1,
                    minWidth: 0,
                    transition: "color 0.15s ease",
                  }}
                >
                  {item.shortTitle}
                </Typography>

                <Typography
                  title={`${item.date} · ${item.time}`}
                  sx={{
                    fontSize: "0.6875rem",
                    color: item.isUnread ? "primary.main" : "text.secondary",
                    fontWeight: item.isUnread ? 600 : 500,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatRelativeTime(item.originalData.createdAt)}
                </Typography>
              </Stack>

              {/* Preview */}
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  // Slightly brighter when selected so it reads clearly
                  color: isSelected ? "text.primary" : "text.secondary",
                  lineHeight: 1.45,
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
                <Chip
                  label={
                    item.isActionable && !item.isDone
                      ? "Action Required"
                      : item.status
                  }
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    borderRadius: "5px",
                    bgcolor: item.isDone
                      ? alpha(theme.palette.text.primary, isDark ? 0.12 : 0.07)
                      : item.isActionable
                        ? alpha(theme.palette.warning.main, isDark ? 0.18 : 0.1)
                        : alpha(theme.palette.success.main, isDark ? 0.18 : 0.1),
                    color: item.isDone
                      ? "text.secondary"
                      : item.isActionable
                        ? isDark
                          ? "warning.light"
                          : "warning.dark"
                        : isDark
                          ? "success.light"
                          : "success.dark",
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
                {item.isUnread && (
                  <Box
                    aria-label="Unread"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Stack>
              </Box>
            </Box>
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
