import { api } from '../api';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export interface CheckAdminsResponse {
  hasAdmins: boolean;
  count: number;
}

export interface AdminJob {
  id: string;
  title: string;
  location: string;
  status: string;
  featured: boolean;
  createdAt: string;
  company: { name: string };
  category: { label: string };
  _count: { applications: number };
}

export interface Dispute {
  id: string;
  contractId: string;
  raisedById: string;
  reason: string;
  evidenceUrls: string[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  contract: {
    id: string;
    freelanceJob: {
      id: string;
      title: string;
      budgetMin: number;
      budgetMax: number;
    };
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    freelancer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface ResolveDisputeDto {
  resolution: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    checkAdmins: builder.query<CheckAdminsResponse, void>({
      query: () => '/admin/check-admins',
      providesTags: ['Admin'],
    }),
    getUsers: builder.query<AdminUser[], void>({
      query: () => '/admin/users',
      providesTags: ['Admin'],
    }),
    suspendUser: builder.mutation<AdminUser, string>({
      query: (id) => ({
        url: `/admin/users/${id}/suspend`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Admin'],
    }),
    getDisputes: builder.query<Dispute[], void>({
      query: () => '/admin/escrow/disputes',
      providesTags: ['Admin'],
    }),
    resolveDispute: builder.mutation<Dispute, { id: string; dto: ResolveDisputeDto }>({
      query: ({ id, dto }) => ({
        url: `/admin/disputes/${id}/resolve`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: ['Admin'],
    }),
    getAdminJobs: builder.query<AdminJob[], void>({
      query: () => '/admin/jobs',
      providesTags: ['Admin', 'Job'],
    }),
    featureJob: builder.mutation<{ id: string; title: string; featured: boolean; message: string }, { id: string; featured: boolean }>({
      query: ({ id, featured }) => ({
        url: `/admin/jobs/${id}/feature`,
        method: 'PATCH',
        body: { featured },
      }),
      invalidatesTags: ['Admin', 'Job'],
    }),
  }),
});

export const {
  useCheckAdminsQuery,
  useGetUsersQuery,
  useSuspendUserMutation,
  useGetDisputesQuery,
  useResolveDisputeMutation,
  useGetAdminJobsQuery,
  useFeatureJobMutation,
} = adminApi;
