import { api } from "../../../service/api";

// ─────────────────────────────────────────────────────────────
// This slice covers only the two read endpoints that are new to the
// backend (added specifically for this dashboard): the global searchable
// user grid and a single user's profile. Create/update/status-change and
// their dropdowns already exist and are reused as-is from
// `features/teamManagement/api/teamManagement.api.ts`
// (useAddNewEmployeeMutation / useUpdateEmployeeMutation /
// useUpdateUserStatusMutation / useGetCreateUserDropdownsQuery), and the
// org hierarchy picker data comes from
// `features/orgHierarchy/api/orgHierarchy.api.ts` (useGetOrgHierarchyByUserQuery).
// ─────────────────────────────────────────────────────────────

const BASE = "/teamoverview";

export interface UserListItem {
  userId: number;
  olmid: string;
  employeeName: string;
  emailId: string;
  mobileNo: string | null;
  designation: string | null;
  employmentType: string;
  jobLevel: string | null;
  officeLocation: string | null;
  dateOfJoining: string | null;
  dateOfLeaving: string | null;
  employeeStatus: "ACTIVE" | "INACTIVE";
  roleId: number | null;
  roleCode: string | null;
  verticalId: number | null;
  verticalName: string | null;
  functionId: number | null;
  functionName: string | null;
  lastLogin: string | null;
}

export interface UserStats {
  activeCount: number;
  inactiveCount: number;
  adminCount: number;
  headCount: number;
  newThisMonth: number;
}

export interface UserPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface UserListResponse {
  page: UserPageResponse<UserListItem>;
  stats: UserStats;
}

export interface UserProfile {
  userId: number;
  olmid: string;
  employeeName: string;
  emailId: string;
  mobileNo: string | null;
  employmentType: string;
  vendorCompany: string | null;
  designation: string | null;
  jobLevel: string | null;
  officeLocation: string | null;
  gender: string | null;
  deviceVendorCapability: string | null;
  dateOfJoining: string | null;
  dateOfLeaving: string | null;
  employeeStatus: "ACTIVE" | "INACTIVE";
  exitType: string | null;
  exitReason: string | null;
  replacementEmpOlmid: string | null;
  replacementEmpName: string | null;
  roleId: number | null;
  roleCode: string | null;
  verticalId: number | null;
  verticalName: string | null;
  functionId: number | null;
  functionName: string | null;
  domainId: number | null;
  domainName: string | null;
  subDomainId: number | null;
  subDomainName: string | null;
  lastLogin: string | null;
}

export interface UserLoginHistoryEntry {
  id: number;
  loginTime: string;
  logoutTime: string | null;
  status: "LOGIN" | "LOGOUT";
}

export interface UserPermissionEntry {
  moduleName: string;
  subModuleName: string;
  permissionName: string;
}

export interface UserProfileResponse {
  profile: UserProfile;
  loginHistory: UserLoginHistoryEntry[];
  permissions: UserPermissionEntry[];
}

export interface GetUsersArgs {
  search?: string;
  roleCode?: string;
  functionId?: number;
  status?: string;
  page: number;
  size: number;
}

const USER_LIST_TAG = { type: "UserManagementList" as const, id: "LIST" as const };

export const userManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserListResponse, GetUsersArgs>({
      query: ({ search, roleCode, functionId, status, page, size }) => ({
        url: `${BASE}/getusers`,
        method: "GET",
        params: { search, roleCode, functionId, status, page, size },
      }),
      providesTags: [USER_LIST_TAG],
    }),

    getUserProfile: builder.query<UserProfileResponse, number>({
      query: (userId) => ({ url: `${BASE}/getuserprofile/${userId}`, method: "GET" }),
      providesTags: (_result, _error, userId) => [
        { type: "UserManagementProfile" as const, id: userId },
      ],
    }),
  }),
});

export const { useGetUsersQuery, useGetUserProfileQuery, useLazyGetUsersQuery } = userManagementApi;

export { USER_LIST_TAG };
