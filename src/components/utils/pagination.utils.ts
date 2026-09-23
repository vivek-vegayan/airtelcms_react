// export function buildRowsPerPageOptions(
//   baseOptions: number[],
//   totalCount?: number | null,
// ): number[] {
//   if (!totalCount || totalCount <= 0) return baseOptions;

//   const maxOption = Math.max(...baseOptions);

//   if (totalCount > maxOption && !baseOptions.includes(totalCount)) {
//     return [...baseOptions, totalCount].sort((a, b) => a - b);
//   }

//   return baseOptions;
// }
// =================== {Fully Configurable} ===================
// type PaginationOptionsConfig = {
//   baseOptions?: number[];
//   includeTotalOnlyIfGreater?: boolean;
// };

// export function createPaginationOptions(
//   totalCount?: number,
//   config?: PaginationOptionsConfig,
// ) {
//   const base = config?.baseOptions ?? [5, 10, 15, 20, 25, 50];
//   const max = Math.max(...base);

//   if (
//     totalCount &&
//     totalCount > 0 &&
//     (!config?.includeTotalOnlyIfGreater || totalCount > max) &&
//     !base.includes(totalCount)
//   ) {
//     return [...base, totalCount].sort((a, b) => a - b);
//   }

//   return base;
// }

// how to use option:1
// const DEFAULT_PAGE_SIZES = [5, 10, 15, 20, 25, 50];

// export function getRowsPerPageOptions(totalCount?: number | null) {
//   return buildRowsPerPageOptions(DEFAULT_PAGE_SIZES, totalCount);
// }

// how to use option:2
// muiPaginationProps: {
//   rowsPerPageOptions: useMemo(() => {
//     return getRowsPerPageOptions(totalRowCount);
//   }, [totalRowCount]),
// },



