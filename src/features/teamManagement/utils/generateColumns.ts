import type { MRT_ColumnDef } from "material-react-table";

export const generateColumns = <T extends Record<string, any>>(
  data: T[],
): MRT_ColumnDef<T>[] => {
  if (!data.length) return [];

  return Object.keys(data[0])
    .filter((key) => key !== "userId") // 🚫 hide userId
    .map((key) => ({
      accessorKey: key,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase()),
      size: 120,
    }));
};
