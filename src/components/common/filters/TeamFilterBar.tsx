import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Divider,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CustomSelect from "./CustomSelect";

interface Props {
  role: string;
  functionOptions: string[];
  subFunctionOptions: string[];
  selectedFunction: string;
  selectedSubFunction: string;
  onFunctionChange: (value: string) => void;
  onSubFunctionChange: (value: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: (type: "csv" | "xlsx") => void;
}

const TeamFilterBar = ({
  role,
  functionOptions,
  subFunctionOptions,
  selectedFunction,
  selectedSubFunction,
  onFunctionChange,
  onSubFunctionChange,
  onAdd,
  onImport,
  onExport,
}: Props) => {
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const canSeeFilters = role !== "basic_user";

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: 3,
        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark
          ? "0 10px 30px rgba(0,0,0,0.35)"
          : "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      {/* LEFT SECTION */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterAltOutlinedIcon fontSize="small" />
          <Typography fontWeight={600}>Filters</Typography>
        </Stack>

        {canSeeFilters && (
          <>
            <CustomSelect
              label="Function"
              value={selectedFunction}
              options={functionOptions}
              onChange={(e) => onFunctionChange(e.target.value)}
              size="small"
            //   sx={{ minWidth: 180 }}
            />

            <CustomSelect
              label="Sub Function"
              value={selectedSubFunction}
              options={subFunctionOptions}
              onChange={(e) => onSubFunctionChange(e.target.value)}
              size="small"
            //   sx={{ minWidth: 200 }}
              disabled={!selectedFunction}
            />
          </>
        )}

        {/* STATUS TOGGLE */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          }}
        >
          <Chip
            icon={<CheckCircleIcon />}
            label="Active"
            clickable
            color={status === "active" ? "success" : "default"}
            variant={status === "active" ? "filled" : "outlined"}
            onClick={() => setStatus("active")}
            sx={{
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          />
          <Chip
            icon={<RadioButtonUncheckedIcon />}
            label="Inactive"
            clickable
            color={status === "inactive" ? "warning" : "default"}
            variant={status === "inactive" ? "filled" : "outlined"}
            onClick={() => setStatus("inactive")}
            sx={{
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          />
        </Stack>
      </Stack>

      {/* RIGHT SECTION */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            borderRadius: 2,
            px: 2,
            fontWeight: 600,
          }}
        >
          Add Member
        </Button>

        <Divider orientation="vertical" flexItem />

        <Tooltip title="Import members">
          <IconButton
            onClick={onImport}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <UploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Export data">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              mt: 1,
              minWidth: 140,
            },
          }}
        >
          <MenuItem onClick={() => onExport("csv")}>Export as CSV</MenuItem>
          <MenuItem onClick={() => onExport("xlsx")}>Export as Excel</MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
};

export default TeamFilterBar;


// import {
//   Box,
//   Button,
//   Chip,
//   Menu,
//   MenuItem,
//   Stack,
//   Typography,
// } from "@mui/material";
// import { useState } from "react";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
// import AddIcon from "@mui/icons-material/Add";
// import UploadIcon from "@mui/icons-material/Upload";
// import DownloadIcon from "@mui/icons-material/Download";
// import CustomSelect from "./CustomSelect";
// // import CustomSelect from "../CustomSelect";

// interface Props {
//   role: string;
//   functionOptions: string[];
//   subFunctionOptions: string[];
//   selectedFunction: string;
//   selectedSubFunction: string;
//   onFunctionChange: (value: string) => void;
//   onSubFunctionChange: (value: string) => void;
//   onAdd: () => void;
//   onImport: () => void;
//   onExport: (type: "csv" | "xlsx") => void;
// }

// const TeamFilterBar = ({
//   role,
//   functionOptions,
//   subFunctionOptions,
//   selectedFunction,
//   selectedSubFunction,
//   onFunctionChange,
//   onSubFunctionChange,
//   onAdd,
//   onImport,
//   onExport,
// }: Props) => {
//   const [status, setStatus] = useState<"active" | "inactive">("active");
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//   const canSeeFilters = role !== "basic_user";

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         p: 1.5,
//         borderRadius: 2,
//         bgcolor: "#fff",
//         boxShadow: "0px 2px 10px rgba(0,0,0,0.06)",
//       }}
//     >
//       {/* LEFT SIDE */}
//       <Stack direction="row" spacing={2} alignItems="center">
//         {canSeeFilters && (
//           <>
//             <CustomSelect
//               label="Select Function"
//               value={selectedFunction}
//               options={functionOptions}
//               onChange={(e) => onFunctionChange(e.target.value)}
//               size="small"
//             //   sx={{ minWidth: 200 }}
//             />

//             <CustomSelect
//               label="Select Sub Function"
//               value={selectedSubFunction}
//               options={subFunctionOptions}
//               onChange={(e) => onSubFunctionChange(e.target.value)}
//               size="small"
//             //   sx={{ minWidth: 220 }}
//               disabled={!selectedFunction}
//             />
//           </>
//         )}

//         {/* STATUS */}
//         <Stack direction="row" spacing={1}>
//           <Chip
//             icon={<CheckCircleIcon />}
//             label="Active"
//             color={status === "active" ? "success" : "default"}
//             variant={status === "active" ? "filled" : "outlined"}
//             onClick={() => setStatus("active")}
//           />
//           <Chip
//             icon={<RadioButtonUncheckedIcon />}
//             label="Inactive"
//             color={status === "inactive" ? "default" : "default"}
//             variant={status === "inactive" ? "filled" : "outlined"}
//             onClick={() => setStatus("inactive")}
//           />
//         </Stack>
//       </Stack>

//       {/* RIGHT SIDE */}
//       <Stack direction="row" spacing={1}>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={onAdd}
//         >
//           Add Member
//         </Button>

//         <Button
//           variant="outlined"
//           startIcon={<UploadIcon />}
//           onClick={onImport}
//         >
//           Import
//         </Button>

//         <Button
//           variant="outlined"
//           startIcon={<DownloadIcon />}
//           onClick={(e) => setAnchorEl(e.currentTarget)}
//         >
//           Export
//         </Button>

//         <Menu
//           anchorEl={anchorEl}
//           open={Boolean(anchorEl)}
//           onClose={() => setAnchorEl(null)}
//         >
//           <MenuItem onClick={() => onExport("csv")}>CSV</MenuItem>
//           <MenuItem onClick={() => onExport("xlsx")}>Excel</MenuItem>
//         </Menu>
//       </Stack>
//     </Box>
//   );
// };

// export default TeamFilterBar;
