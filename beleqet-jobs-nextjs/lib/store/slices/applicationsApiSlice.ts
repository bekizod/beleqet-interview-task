import { api } from '../api';

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  OFFERED = 'OFFERED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface CreateApplicationDto {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  screeningAnswers?: Record<string, any>;
  portfolioUrl?: string;
  expectedSalary?: number;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
}

export interface CandidateScore {
  id: string;
  applicationId: string;
  userId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  cultureFitScore?: number;
  reasoning?: string;
  rawAiResponse?: any;
  modelUsed: string;
  scoredAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  interviewSlot?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  expectedSalary?: number;
  portfolioUrl?: string;
  screeningAnswers?: any;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    type: string;
    company: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  score?: CandidateScore;
}

export const applicationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    submitApplication: builder.mutation<Application, CreateApplicationDto>({
      query: (dto) => ({
        url: '/applications',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Application', 'Job'],
    }),
    getMyApplications: builder.query<Application[], void>({
      query: () => '/applications/my',
      providesTags: ['Application'],
    }),
    getJobApplications: builder.query<Application[], string>({
      query: (jobId) => `/applications/job/${jobId}`,
      providesTags: ['Application'],
    }),
    getApplication: builder.query<Application, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (result) => [{ type: 'Application', id: result?.id }],
    }),
    updateApplicationStatus: builder.mutation<Application, { id: string; status: ApplicationStatus }>({
      query: ({ id, status }) => ({
        url: `/applications/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result) => [{ type: 'Application', id: result?.id }, 'Application'],
    }),
  }),
});

export const {
  useSubmitApplicationMutation,
  useGetMyApplicationsQuery,
  useGetJobApplicationsQuery,
  useGetApplicationQuery,
  useUpdateApplicationStatusMutation,
} = applicationsApi;
