import { api } from '../api';

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  CONTRACT = 'CONTRACT',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export interface CreateJobDto {
  title: string;
  description: string;
  requirements?: string;
  location: string;
  type: JobType;
  categoryId: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  featured?: boolean;
  tags?: string[];
  filled?: boolean;
  urgent?: boolean;
  jobSite?: string;
  gender?: string;
  salaryType?: string;
  vacancies?: number;
  experienceLevel?: string;
  yearsOfExperience?: string;
  qualification?: string;
  expiryDate?: string;
  applyType?: string;
  applyUrl?: string;
  applyEmail?: string;
  contactPhone?: string;
  companyName?: string;
  companyLogo?: string;
  status?: JobStatus;
  currency?: string;
}

export interface QueryJobsDto {
  q?: string;
  category?: string;
  location?: string;
  type?: JobType;
  page?: number;
  limit?: number;
}

export interface JobCategory {
  id: string;
  slug: string;
  label: string;
  icon?: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  verified: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  type: JobType;
  categoryId: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  deadline?: string;
  status: JobStatus;
  featured: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  applyEmail?: string;
  applyType?: string;
  applyUrl?: string;
  companyLogo?: string;
  companyName?: string;
  contactPhone?: string;
  experienceLevel?: string;
  expiryDate?: string;
  filled: boolean;
  gender?: string;
  jobSite?: string;
  qualification?: string;
  salaryType?: string;
  tags?: string[];
  urgent: boolean;
  vacancies?: number;
  yearsOfExperience?: string;
  category: JobCategory;
  company: Company;
  _count: {
    applications: number;
  };
}

export interface JobsResponse {
  items: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const jobsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<JobsResponse, QueryJobsDto>({
      query: (params) => ({
        url: '/jobs',
        params: params.type === undefined ? { ...params, type: undefined } : params,
      }),
      providesTags: ['Job'],
    }),
    getJob: builder.query<Job, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (result) => [{ type: 'Job', id: result?.id }],
    }),
    getMyJobs: builder.query<Job[], void>({
      query: () => '/jobs/my',
      providesTags: ['Job'],
    }),
    getCategories: builder.query<JobCategory[], void>({
      query: () => '/jobs/categories',
      providesTags: ['Job'],
    }),
    createJob: builder.mutation<Job, CreateJobDto>({
      query: (dto) => ({
        url: '/jobs',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Job'],
    }),
    updateJob: builder.mutation<Job, { id: string; dto: Partial<CreateJobDto> }>({
      query: ({ id, dto }) => ({
        url: `/jobs/${id}`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: (result) => [{ type: 'Job', id: result?.id }, 'Job'],
    }),
    deleteJob: builder.mutation<Job, string>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Job'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useGetMyJobsQuery,
  useGetCategoriesQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} = jobsApi;
