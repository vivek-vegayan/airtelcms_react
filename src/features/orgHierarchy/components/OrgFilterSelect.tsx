import { MenuItem, TextField } from "@mui/material";
import { memo } from "react";
import type { OrgFilterOption } from "../types/orgHierarchy.types";

interface Props {
  label: string;
  value?: number;
  options: OrgFilterOption[];
  onChange: (value?: number) => void;
  disabled?: boolean;
}

const OrgFilterSelect = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: Props) => {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : Number(v));
      }}
      sx={{
        minWidth: 180,
        "& .MuiInputBase-root": {
          height: 32,
        },
        "& .MuiInputBase-input": {
          padding: "4px 8px",
          fontSize: "0.8rem",
        },
        "& .MuiInputLabel-root": {
          fontSize: "0.8rem",
          transform: "translate(8px, 7px) scale(1)",
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(12px, -6px) scale(0.75)",
        },
      }}
    >
      {options.map((opt) => (
        <MenuItem
          key={opt.value}
          value={opt.value}
          sx={{ fontSize: "0.8rem", py: 0.5 }}
        >
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default memo(OrgFilterSelect);

// // In current text field height of this text field is too long I want it more compact,and best
// // give me implemenatiion and provide final copy past code

// import { MenuItem, TextField } from "@mui/material";
// import type { OrgFilterOption } from "../types/orgHierarchy.types";

// interface Props {
//   label: string;
//   value?: number;
//   options: OrgFilterOption[];
//   onChange: (value?: number) => void;
// }

// interface Props {
//   label: string;
//   value?: number;
//   options: OrgFilterOption[];
//   onChange: (value?: number) => void;
//   disabled?: boolean;   //
// }

// const OrgFilterSelect = ({
//   label,
//   value,
//   options,
//   onChange,
//   disabled = false,
// }: Props) => {
//   return (
//     <TextField
//       select
//       size="small"
//       label={label}
//       value={value ?? ""}
//       disabled={disabled}
//       onChange={(e) => {
//         const v = e.target.value;
//         onChange(v === "" ? undefined : Number(v));
//       }}
//       sx={{ minWidth: 180 }}
//     >
//       {options.map((opt) => (
//         <MenuItem key={opt.value} value={opt.value}>
//           {opt.label}
//         </MenuItem>
//       ))}
//     </TextField>
//   );
// };

// export default OrgFilterSelect;

// // import { MenuItem, TextField } from "@mui/material";
// // import type { OrgFilterOption } from "../types/orgHierarchy.types";

// // interface Props {
// //   label: string;
// //   value?: number;
// //   options: OrgFilterOption[];
// //   onChange: (value?: number) => void;
// // }

// // const OrgFilterSelect = ({
// //   label,
// //   value,
// //   options,
// //   onChange,
// // }: Props) => {
// //   return (
// //     <TextField
// //       select
// //       size="small"
// //       label={label}
// //       value={value ?? ""}
// //       onChange={(e) => {
// //         const v = e.target.value;
// //         onChange(v === "" ? undefined : Number(v));
// //       }}
// //       sx={{ minWidth: 220 }}
// //     >
// //       {options.map((opt) => (
// //         <MenuItem key={opt.value} value={opt.value}>
// //           {opt.label}
// //         </MenuItem>
// //       ))}
// //     </TextField>
// //   );
// // };

// // export default OrgFilterSelect;
