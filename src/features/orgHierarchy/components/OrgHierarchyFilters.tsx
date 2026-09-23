import { Box } from "@mui/material";
import { getOrgFilterVisibility } from "../config/orgFilterVisibility";
import type {
  OrgFilterKey,
  OrgFilterValues,
  OrgFilterOption,
} from "../types/orgHierarchy.types";
import OrgFilterSelect from "./OrgFilterSelect";

const LABELS: Record<OrgFilterKey, string> = {
  vertical: "Vertical",
  teamFunction: "Team Function",
  domain: "Domain",
  subDomain: "Sub Domain",
};

interface Props {
  role: string;
  values: OrgFilterValues;
  options: Record<OrgFilterKey, OrgFilterOption[]>;
  onChange: (key: OrgFilterKey, value?: number) => void;
  children?: React.ReactNode;
}

const OrgHierarchyFilters = ({
  role,
  values,
  options,
  onChange,
  children,
}: Props) => {
  const visible = getOrgFilterVisibility(role);

  return (
    <Box display="flex" gap={2} alignItems="center" sx={{ mt: 0 }}>
      {visible.map((key, index) => {
        let disabled = false;

        // get previous visible filter
        const prevKey = visible[index - 1];

        if (prevKey) {
          disabled = !values[prevKey];
        }

        return (
          <OrgFilterSelect
            key={key}
            label={LABELS[key]}
            value={values[key]}
            options={options[key]}
            disabled={disabled}
            onChange={(v) => onChange(key, v)}
          />
        );
      })}

      {children}
    </Box>
  );
};
// const OrgHierarchyFilters = ({
//   role,
//   values,
//   options,
//   onChange,
//   children,
// }: Props) => {
//   const visible = ORG_FILTER_VISIBILITY[role] ?? [];

//   return (
//     <Box display="flex" gap={2} alignItems="center" sx={{ mt: 0 }}>
//       {visible.map((key) => {
//         let disabled = false;

//         if (key === "teamFunction") {
//           disabled = !values.vertical;
//         }

//         if (key === "domain") {
//           disabled = !values.teamFunction;
//         }

//         if (key === "subDomain") {
//           disabled = !values.domain;
//         }

//         return (
//           <OrgFilterSelect
//             key={key}
//             label={LABELS[key]}
//             value={values[key]}
//             options={options[key]}
//             disabled={disabled}
//             onChange={(v) => onChange(key, v)}
//           />
//         );
//       })}

//       {children}
//     </Box>
//   );
// };

export default OrgHierarchyFilters;

// More scalable Code
// const hierarchy: OrgFilterKey[] = [
//   "vertical",
//   "teamFunction",
//   "domain",
//   "subDomain",
// ];

// {visible.map((key) => {
//   const index = hierarchy.indexOf(key);

//   let disabled = false;

//   if (index > 0) {
//     const parentKey = hierarchy[index - 1];
//     disabled = !values[parentKey];
//   }

//   return (
//     <OrgFilterSelect
//       key={key}
//       label={LABELS[key]}
//       value={values[key]}
//       options={options[key]}
//       disabled={disabled}
//       onChange={(v) => onChange(key, v)}
//     />
//   );
// })}
