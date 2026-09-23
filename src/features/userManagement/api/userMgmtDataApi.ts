import { api } from "../../../service/api";

export interface LoginDetailsPayload {
  startDate: string;
  endDate: string;
  subDomainId: number;
  page?: number;
  size?: number;
  olmId?: string;
}

export interface LoginLog {
  id: number;
  loginTime: string;
  logoutTime: string;
  status: "LOGIN" | "LOGOUT";
  tokenId: string;
  userId: number;
  username: string;
}

export const rosterApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getLoginDetails: builder.query<LoginLog[], LoginDetailsPayload>({
      query: ({
        startDate,
        endDate,
        subDomainId,
        page = 0,
        size = 10,
        olmId,
      }) => ({
        url: "/usermanagement/logindetails",
        method: "GET",
        params: {
          startDate,
          endDate,
          subDomainId,
          page,
          size,
          olmId, // ✅ send in params
        },
      }),

      providesTags: ["LoginDetails"],
    }),
  }),
});

export const { useLazyGetLoginDetailsQuery } = rosterApiSlice;