import { api } from "../../../../service/api";

// ─────────────────────────────────────────────────────────────
//  Response models (mirror OrgHierarchyAdminController's *Model)
// ─────────────────────────────────────────────────────────────

export interface VerticalModel {
  verticalId: number;
  verticalCode: string;
  verticalName: string;
  isActive: boolean;
  createdAt: string;
}

export interface FunctionModel {
  functionId: number;
  verticalId: number;
  verticalName: string;
  functionCode: string;
  functionName: string;
  isActive: boolean;
  createdAt: string;
}

export interface DomainModel {
  domainId: number;
  functionId: number;
  functionName: string;
  domainCode: string;
  domainName: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubDomainModel {
  subDomainId: number;
  domainId: number;
  domainName: string;
  subDomainCode: string;
  subDomainName: string;
  isActive: boolean;
  createdAt: string;
}

/** Mirrors backend common/dto/PageResponseDto.java */
export interface OrgPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse {
  status: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
//  Request models
// ─────────────────────────────────────────────────────────────

interface ListArgs {
  search?: string;
  statusFilter?: number;
  page: number;
  size: number;
}

export interface CreateVerticalRequest {
  code: string;
  name: string;
}

export interface UpdateVerticalRequest {
  verticalId: number;
  code: string;
  name: string;
}

export interface CreateFunctionRequest {
  verticalId: number;
  code: string;
  name: string;
}

export interface UpdateFunctionRequest {
  functionId: number;
  code: string;
  name: string;
}

export interface CreateDomainRequest {
  functionId: number;
  code: string;
  name: string;
}

export interface UpdateDomainRequest {
  domainId: number;
  code: string;
  name: string;
}

export interface CreateSubDomainRequest {
  domainId: number;
  code: string;
  name: string;
}

export interface UpdateSubDomainRequest {
  subDomainId: number;
  code: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────
//  API slice
// ─────────────────────────────────────────────────────────────

const BASE = "/global-settings/org-hierarchy";

const VERTICAL_LIST_TAG = { type: "ORG_VERTICAL_LIST" as const, id: "LIST" as const };
const FUNCTION_LIST_TAG = { type: "ORG_FUNCTION_LIST" as const, id: "LIST" as const };
const DOMAIN_LIST_TAG = { type: "ORG_DOMAIN_LIST" as const, id: "LIST" as const };
const SUBDOMAIN_LIST_TAG = { type: "ORG_SUBDOMAIN_LIST" as const, id: "LIST" as const };

// A status change on a level cascades deactivation to every level beneath
// it server-side, so its list tag and every descendant level's list tag
// must all be invalidated together. "ORG_HIERARCHY" is invalidated on every
// mutation so the existing read-only cascading dropdowns elsewhere in the
// app (OrgFilterSelect, team management) stay in sync automatically.
export const orgConfigApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Vertical ─────────────────────────────────────────────
    getVerticals: builder.query<OrgPageResponse<VerticalModel>, ListArgs>({
      query: ({ search, statusFilter, page, size }) => ({
        url: `${BASE}/verticals`,
        method: "GET",
        params: { search, statusFilter, page, size },
      }),
      providesTags: [VERTICAL_LIST_TAG],
    }),

    createVertical: builder.mutation<ApiResponse, CreateVerticalRequest>({
      query: (body) => ({ url: `${BASE}/verticals`, method: "POST", body }),
      invalidatesTags: [VERTICAL_LIST_TAG, "ORG_HIERARCHY"],
    }),

    updateVertical: builder.mutation<ApiResponse, UpdateVerticalRequest>({
      query: ({ verticalId, code, name }) => ({
        url: `${BASE}/verticals/${verticalId}`,
        method: "PUT",
        body: { code, name },
      }),
      invalidatesTags: [VERTICAL_LIST_TAG, "ORG_HIERARCHY"],
    }),

    changeVerticalStatus: builder.mutation<ApiResponse, { verticalId: number; isActive: boolean }>({
      query: ({ verticalId, isActive }) => ({
        url: `${BASE}/verticals/${verticalId}/status`,
        method: "PATCH",
        params: { isActive },
      }),
      invalidatesTags: [VERTICAL_LIST_TAG, FUNCTION_LIST_TAG, DOMAIN_LIST_TAG, SUBDOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    // ── Function ─────────────────────────────────────────────
    getFunctions: builder.query<OrgPageResponse<FunctionModel>, ListArgs & { verticalId?: number }>({
      query: ({ verticalId, search, statusFilter, page, size }) => ({
        url: `${BASE}/functions`,
        method: "GET",
        params: { verticalId, search, statusFilter, page, size },
      }),
      providesTags: [FUNCTION_LIST_TAG],
    }),

    createFunction: builder.mutation<ApiResponse, CreateFunctionRequest>({
      query: (body) => ({ url: `${BASE}/functions`, method: "POST", body }),
      invalidatesTags: [FUNCTION_LIST_TAG, "ORG_HIERARCHY"],
    }),

    updateFunction: builder.mutation<ApiResponse, UpdateFunctionRequest>({
      query: ({ functionId, code, name }) => ({
        url: `${BASE}/functions/${functionId}`,
        method: "PUT",
        body: { code, name },
      }),
      invalidatesTags: [FUNCTION_LIST_TAG, "ORG_HIERARCHY"],
    }),

    changeFunctionStatus: builder.mutation<ApiResponse, { functionId: number; isActive: boolean }>({
      query: ({ functionId, isActive }) => ({
        url: `${BASE}/functions/${functionId}/status`,
        method: "PATCH",
        params: { isActive },
      }),
      invalidatesTags: [FUNCTION_LIST_TAG, DOMAIN_LIST_TAG, SUBDOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    // ── Domain ───────────────────────────────────────────────
    getDomains: builder.query<OrgPageResponse<DomainModel>, ListArgs & { functionId?: number }>({
      query: ({ functionId, search, statusFilter, page, size }) => ({
        url: `${BASE}/domains`,
        method: "GET",
        params: { functionId, search, statusFilter, page, size },
      }),
      providesTags: [DOMAIN_LIST_TAG],
    }),

    createDomain: builder.mutation<ApiResponse, CreateDomainRequest>({
      query: (body) => ({ url: `${BASE}/domains`, method: "POST", body }),
      invalidatesTags: [DOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    updateDomain: builder.mutation<ApiResponse, UpdateDomainRequest>({
      query: ({ domainId, code, name }) => ({
        url: `${BASE}/domains/${domainId}`,
        method: "PUT",
        body: { code, name },
      }),
      invalidatesTags: [DOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    changeDomainStatus: builder.mutation<ApiResponse, { domainId: number; isActive: boolean }>({
      query: ({ domainId, isActive }) => ({
        url: `${BASE}/domains/${domainId}/status`,
        method: "PATCH",
        params: { isActive },
      }),
      invalidatesTags: [DOMAIN_LIST_TAG, SUBDOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    // ── Sub Domain ───────────────────────────────────────────
    getSubDomains: builder.query<OrgPageResponse<SubDomainModel>, ListArgs & { domainId?: number }>({
      query: ({ domainId, search, statusFilter, page, size }) => ({
        url: `${BASE}/sub-domains`,
        method: "GET",
        params: { domainId, search, statusFilter, page, size },
      }),
      providesTags: [SUBDOMAIN_LIST_TAG],
    }),

    createSubDomain: builder.mutation<ApiResponse, CreateSubDomainRequest>({
      query: (body) => ({ url: `${BASE}/sub-domains`, method: "POST", body }),
      invalidatesTags: [SUBDOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    updateSubDomain: builder.mutation<ApiResponse, UpdateSubDomainRequest>({
      query: ({ subDomainId, code, name }) => ({
        url: `${BASE}/sub-domains/${subDomainId}`,
        method: "PUT",
        body: { code, name },
      }),
      invalidatesTags: [SUBDOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),

    changeSubDomainStatus: builder.mutation<ApiResponse, { subDomainId: number; isActive: boolean }>({
      query: ({ subDomainId, isActive }) => ({
        url: `${BASE}/sub-domains/${subDomainId}/status`,
        method: "PATCH",
        params: { isActive },
      }),
      invalidatesTags: [SUBDOMAIN_LIST_TAG, "ORG_HIERARCHY"],
    }),
  }),
});

export const {
  useGetVerticalsQuery,
  useCreateVerticalMutation,
  useUpdateVerticalMutation,
  useChangeVerticalStatusMutation,
  useGetFunctionsQuery,
  useCreateFunctionMutation,
  useUpdateFunctionMutation,
  useChangeFunctionStatusMutation,
  useGetDomainsQuery,
  useCreateDomainMutation,
  useUpdateDomainMutation,
  useChangeDomainStatusMutation,
  useGetSubDomainsQuery,
  useCreateSubDomainMutation,
  useUpdateSubDomainMutation,
  useChangeSubDomainStatusMutation,
} = orgConfigApi;
