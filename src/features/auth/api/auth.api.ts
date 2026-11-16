import { api } from "../../../service/api";
import { setToken } from "../slices/auth.slice";
import type { LoggedUserApiResponse, LoginResponse } from "../types/auth.types";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { olmId: string; password: string }>(
      {
        query: (body) => ({
          url: "/auth/v1/signin",
          method: "POST",
          body,
        }),
      },
    ),

    getLoggedUser: builder.query<LoggedUserApiResponse, void>({
      query: () => "/users/v2/getloggeduserdetails",
    }),

    // Ends a stranded session for an account the caller can prove they own, so
    // they can sign in after a 403 "Already Logged". This used to POST a bare
    // { olmId } to /auth/v1/logout — an endpoint that required no credentials
    // at all, so knowing someone's OLM ID was enough to end their session, and
    // they saw it as "Invalid session" mid-work. The backend now re-checks the
    // account password before terminating anything.
    terminateSession: builder.mutation<void, { olmId: string; password: string }>(
      {
        query: (body) => ({
          url: "/auth/v1/session/terminate",
          method: "POST",
          body,
        }),
      },
    ),

    // Activity heartbeat / "Stay signed in": renews the access token from the
    // httpOnly refresh cookie and slides the server's idle deadline. A 401
    // here means the session is over and api.ts signs the user out.
    refreshSession: builder.mutation<LoginResponse, void>({
      query: () => ({ url: "/auth/v1/refresh", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.accessToken) dispatch(setToken(data.accessToken));
        } catch {
          // Handled globally in api.ts.
        }
      },
    }),

    logout: builder.mutation<void, { olmId: string }>({
      query: (body) => ({
        url: "/auth/v1/logout",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLazyGetLoggedUserQuery,
  useTerminateSessionMutation,
  useRefreshSessionMutation,
  useLogoutMutation,
} = authApi;
