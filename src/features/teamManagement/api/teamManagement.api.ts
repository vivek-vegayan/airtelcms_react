import { api } from "../../../service/api";
import type {
  ApiResponse,
  CreateEmployeeRequest,
  CreateOtherEmployeeRequest,
} from "../types/createUser.types";
import type { UpdateEmployeeRequest } from "../types/updateUser.types";
import type { UpdateUserStatusRequest } from "../types/updateUserStatus.types";

export interface CreateUserDropdownResponse {
  employmentTypes: string[];
  vendorCompanies: string[];
  designations: string[];
  jobLevels: string[];
  officeLocations: string[];
  deviceVendorCapabilities: string[];
  roleCode: string[];
}

export interface ExcelUploadRowResult {
  rowNumber: number;
  olmid: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  message: string;
}

export type ExcelUploadJobStatus =
  | "QUEUED"
  | "VALIDATING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";

export interface ExcelUploadStartResponse {
  uploadId: string;
  status: ExcelUploadJobStatus;
  message: string;
  fileName: string;
  fileSizeBytes: number;
  totalRows: number;
}

export interface ExcelUploadProgress {
  uploadId: string;
  status: ExcelUploadJobStatus;
  stage: string;
  percentComplete: number;

  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  skippedRows: number;

  currentBatch: number;
  totalBatches: number;
  estimatedSecondsRemaining: number | null;

  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface ExcelValidationError {
  rowNumber: number;
  olmid: string;
  columnName: string;
  invalidValue: string;
  errorMessage: string;
  status: string;
}

export interface ExcelUploadSummary {
  uploadId: string;
  fileName: string;
  uploadedBy: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  skippedRows: number;
  totalBatches: number;
  totalDurationMs: number;
  avgMsPerBatch: number;
  avgMsPerRecord: number;
  startedAt: string;
  completedAt: string | null;
}

export interface ExcelUploadResult {
  summary: ExcelUploadSummary;
  rowResults: ExcelUploadRowResult[];
  validationErrors: ExcelValidationError[];
  errorReportAvailable: boolean;
}

// Every employee write has to reach the User Management dashboard too - it
// reads through its own tags (`features/userManagement/api/userManagementApi`),
// so invalidating "EMPLOYEES" alone left that grid and its stat cards showing
// pre-edit rows until something else happened to refetch them.
const USER_DIRECTORY_TAGS = [
  "EMPLOYEES" as const,
  { type: "UserManagementList" as const, id: "LIST" as const },
];

export const orgHierarchyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    addNewEmployee: builder.mutation<ApiResponse, CreateEmployeeRequest>({
      query: (body) => ({
        url: "/teamoverview/v2/addnewemp",
        method: "POST",
        body,
      }),
      invalidatesTags: USER_DIRECTORY_TAGS,
    }),

    addNewOtherEmployee: builder.mutation<ApiResponse, CreateOtherEmployeeRequest>({
      query: (body) => ({
        url: "/teamoverview/addnewotheremp",
        method: "POST",
        body,
      }),
      invalidatesTags: USER_DIRECTORY_TAGS,
    }),

    getCreateUserDropdowns: builder.query<CreateUserDropdownResponse, void>({
      query: () => ({
        url: "/teamoverview/getcreateuserdropdowns",
        method: "GET",
      }),
      keepUnusedDataFor: 6,
    }),

    updateEmployee: builder.mutation<
      { status: string; message: string },
      UpdateEmployeeRequest
    >({
      query: (body) => ({
        url: "/teamoverview/v1/updateemp",
        method: "PUT",
        body,
      }),
      // Also drops the edited user's cached profile, so the drawer behind the
      // dialog repaints with what was actually saved instead of the pre-edit copy.
      invalidatesTags: (_result, _error, arg) => [
        ...USER_DIRECTORY_TAGS,
        { type: "UserManagementProfile" as const, id: arg.userId },
      ],
    }),

    updateUserStatus: builder.mutation<
      { status: string; message: string },
      UpdateUserStatusRequest
    >({
      query: (body) => ({
        url: "/teamoverview/v1/updateuserstatus",
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        ...USER_DIRECTORY_TAGS,
        { type: "UserManagementProfile" as const, id: arg.userId },
      ],
    }),

    // ── Download pre-filled template ──────────────────────────────────────
    downloadEmployeeTemplate: builder.query<Blob, void>({
      query: () => ({
        url: "/teamoverview/excel/v1/template",
        method: "GET",
        responseHandler: (response) => response.blob(),
        // prevent RTK Query from trying to parse as JSON
        cache: "no-cache",
      }),
    }),

    // ── Upload filled Excel file (synchronous - kept for backward compatibility) ──
    uploadEmployeesFromExcel: builder.mutation<ExcelUploadRowResult[], File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/teamoverview/excel/v1/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: USER_DIRECTORY_TAGS,
    }),

    // ── Upload filled Excel file (asynchronous — returns an uploadId immediately) ──
    startExcelUploadAsync: builder.mutation<ExcelUploadStartResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/teamoverview/excel/v1/upload/async",
          method: "POST",
          body: formData,
        };
      },
      // Nothing is written to the DB yet at this point - invalidation happens
      // once the caller observes a terminal status from getUploadStatus.
    }),

    // ── Poll upload progress ──────────────────────────────────────────────
    getUploadStatus: builder.query<ExcelUploadProgress, string>({
      query: (uploadId) => ({
        url: `/teamoverview/excel/v1/upload/${uploadId}/status`,
        method: "GET",
      }),
    }),

    // ── Fetch final row results + validation errors once terminal ────────
    getUploadResult: builder.query<ExcelUploadResult, string>({
      query: (uploadId) => ({
        url: `/teamoverview/excel/v1/upload/${uploadId}/result`,
        method: "GET",
      }),
    }),

    // ── Download the error report workbook ────────────────────────────────
    getUploadErrorReport: builder.query<Blob, string>({
      query: (uploadId) => ({
        url: `/teamoverview/excel/v1/upload/${uploadId}/error-report`,
        method: "GET",
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useAddNewEmployeeMutation,
  useAddNewOtherEmployeeMutation,
  useGetCreateUserDropdownsQuery,
  useUpdateEmployeeMutation,
  useUpdateUserStatusMutation,
  // lazy query so we can trigger download on button click
  useLazyDownloadEmployeeTemplateQuery,
  useUploadEmployeesFromExcelMutation,
  useStartExcelUploadAsyncMutation,
  useGetUploadStatusQuery,
  useLazyGetUploadResultQuery,
  useLazyGetUploadErrorReportQuery,
} = orgHierarchyApi;

// import { api } from "../../../service/api";
// import type {
//   ApiResponse,
//   CreateEmployeeRequest,
// } from "../types/createUser.types";
// import type { UpdateEmployeeRequest } from "../types/updateUser.types";
// import type { UpdateUserStatusRequest } from "../types/updateUserStatus.types";

// export interface CreateUserDropdownResponse {
//   employmentTypes: string[];
//   vendorCompanies: string[];
//   designations: string[];
//   jobLevels: string[];
//   officeLocations: string[];
//   deviceVendorCapabilities: string[];
//   roleCode: string[];
// }

// export const orgHierarchyApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     addNewEmployee: builder.mutation<ApiResponse, CreateEmployeeRequest>({
//       query: (body) => ({
//         // url: "/teamoverview/v1/addnewemp",
//         url:"/teamoverview/v2/addnewemp",
//         method: "POST",
//         body,
//       }),

//       invalidatesTags: ["EMPLOYEES"],
//     }),
//     getCreateUserDropdowns: builder.query<CreateUserDropdownResponse, void>({
//       query: () => ({
//         url: "/teamoverview/getcreateuserdropdowns",
//         method: "GET",
//       }),
//       keepUnusedDataFor: 6,
//     }),
//     // useUpdateEmployeeMutation
//     updateEmployee: builder.mutation<
//       { status: string; message: string },
//       UpdateEmployeeRequest
//     >({
//       query: (body) => ({
//         url: "/teamoverview/v1/updateemp",
//         method: "PUT",
//         body,
//       }),
//       invalidatesTags: ["EMPLOYEES"],
//     }),
//     updateUserStatus: builder.mutation<
//       { status: string; message: string },
//       UpdateUserStatusRequest
//     >({
//       query: (body) => ({
//         url: "/teamoverview/v1/updateuserstatus",
//         method: "PUT",
//         body,
//       }),
//       invalidatesTags: ["EMPLOYEES"],
//     }),
//     uploadEmployeesFromExcel: builder.mutation<
//       {
//         rowNumber: number;
//         olmid: string;
//         status: "SUCCESS" | "FAILED";
//         message: string;
//       }[],
//       File
//     >({
//       query: (file) => {
//         const formData = new FormData();
//         formData.append("file", file);

//         return {
//           url: "/teamoverview/v1/upload-employees",
//           method: "POST",
//           body: formData,
//         };
//       },
//       invalidatesTags: ["EMPLOYEES"],
//     }),
//   }),

//   overrideExisting: false,
// });

// export const {
//   useAddNewEmployeeMutation,
//   useGetCreateUserDropdownsQuery,
//   useUpdateEmployeeMutation,
//   useUpdateUserStatusMutation,
//   useUploadEmployeesFromExcelMutation
// } = orgHierarchyApi;
