import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../config/apiConfig";
import { API_ENDPOINTS } from "../../utils/constants/apiEndpoints";
import { StorageService } from "../utils/StorageService";

import type {
  Organization,
  CreateOrganizationRequest,
  OrganizationResponse,
  UserListResponse,
  CreateMemberRequest,
  CreateMemberResponse,
  UserItem,
} from "./OrganizationService";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const storage = new StorageService();

const baseQuery = fetchBaseQuery({
  baseUrl: apiConfig.baseURL,
  prepareHeaders: (headers) => {
    const token = storage.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    return headers;
  },
});

export const organizationApi = createApi({
  reducerPath: "organizationApi",
  baseQuery,
  tagTypes: ["Organizations", "Members"],

  endpoints: (builder) => ({
    /**
     * POST /organizations
     * body: CreateOrganizationRequest
     * returns: Organization
     */
    createOrganization: builder.mutation<
      Organization,
      CreateOrganizationRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.ORGANIZATIONS.CREATE,
        method: "POST",
        body,
      }),
      transformResponse: (resp: ApiResponse<Organization> | Organization) =>
        (resp as any).data ?? (resp as Organization),
      invalidatesTags: ["Organizations"],
    }),

    /**
     * GET /organizations/my
     * returns: Organization[]
     * (your file defined OrganizationResponse = { message, data: Organization[] })
     */
    getMyOrganizations: builder.query<Organization[], void>({
      query: () => ({
        url: API_ENDPOINTS.ORGANIZATIONS.MY,
        method: "GET",
      }),
      transformResponse: (
        resp:
          | OrganizationResponse
          | ApiResponse<Organization[]>
          | Organization[]
      ) => (resp as any).data ?? (resp as Organization[]),
      providesTags: ["Organizations"],
    }),

    /**
     * GET /users/list?page=&page_size=
     * returns: UserListResponse["data"] (items & paging)
     */
    getAllMembers: builder.query<
      UserListResponse["data"],
      { page?: number; page_size?: number } | void
    >({
      query: (params) => {
        const page = params?.page ?? 1;
        const page_size = params?.page_size ?? 50;
        const qs = `?page=${page}&page_size=${page_size}`;
        return {
          url: `${API_ENDPOINTS.USERS.LIST}${qs}`,
          method: "GET",
        };
      },
      transformResponse: (
        resp: UserListResponse | ApiResponse<UserListResponse["data"]>
      ) => (resp as any).data,
      providesTags: ["Members"],
    }),

    /**
     * POST /users/members
     * body: CreateMemberRequest
     * returns: CreateMemberResponse (we unwrap to its `data` if you prefer; here we keep full response shape)
     */
    createOrganizationMember: builder.mutation<
      CreateMemberResponse,
      CreateMemberRequest
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.USERS.ADD_MEMBER,
        method: "POST",
        body: payload,
      }),
      transformResponse: (
        resp: ApiResponse<CreateMemberResponse["data"]> | CreateMemberResponse
      ) => {
        // If backend returns envelope of the inner data, lift it into the expected shape
        if ((resp as any)?.data && !(resp as any)?.success) {
          return {
            success: true,
            message: (resp as any)?.message ?? "OK",
            data: (resp as any).data,
          } as CreateMemberResponse;
        }
        return resp as CreateMemberResponse;
      },
      invalidatesTags: ["Members", "Organizations"],
    }),
  }),
});

export const {
  useCreateOrganizationMutation,
  useGetMyOrganizationsQuery,
  useLazyGetMyOrganizationsQuery,
  useLazyGetAllMembersQuery,
  useGetAllMembersQuery,
  useCreateOrganizationMemberMutation,
} = organizationApi;
