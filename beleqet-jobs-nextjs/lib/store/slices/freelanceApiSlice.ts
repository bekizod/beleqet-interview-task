import { api } from '../api';

export enum FreelanceJobStatus {
  DRAFT = 'DRAFT',
  FUNDED = 'FUNDED',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export enum EscrowStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  IN_REVIEW = 'IN_REVIEW',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export interface FreelanceCategory {
  id: string;
  slug: string;
  label: string;
  icon?: string;
}

export interface CreateFreelanceJobDto {
  title: string;
  description: string;
  categoryId?: string;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  pricingType?: string;
  deadlineDays: number;
  skills: string[];
  locationPreference?: string;
  experienceLevel?: string;
  attachments?: string[];
}

export interface CreateBidDto {
  amount: number;
  timelineDays: number;
  coverLetter: string;
}

export interface FreelanceCategory {
  id: string;
  slug: string;
  label: string;
  icon?: string;
}

export interface FreelanceJob {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  clientId: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  pricingType: string;
  deadlineDays: number;
  skills: string[];
  status: FreelanceJobStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  experienceLevel?: string;
  locationPreference?: string;
  category: FreelanceCategory;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  bids?: Bid[];
  contract?: any;
  escrowTx?: any;
}

export interface Bid {
  id: string;
  freelanceJobId: string;
  freelancerId: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: BidStatus;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  freelanceJob?: {
    id: string;
    title: string;
    category: FreelanceCategory;
  };
}

export interface Deliverable {
  id: string;
  milestoneId: string;
  fileUrl?: string;
  notes?: string;
  submittedAt: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  amount: number;
  deadline: string;
  status: MilestoneStatus;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  deliverables?: Deliverable[];
}

export interface Contract {
  id: string;
  freelanceJobId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  currency: string;
  status: ContractStatus;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
  freelanceJob?: {
    id: string;
    title: string;
    description?: string;
    budgetMin: number;
    budgetMax: number;
    escrowTx?: EscrowTransaction;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  milestones?: Milestone[];
  dispute?: {
    id: string;
    reason: string;
    resolution?: string;
    resolvedAt?: string;
  };
}

export interface EscrowTransaction {
  id: string;
  freelanceJobId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: EscrowStatus;
  gatewayRef?: string;
  gatewayResponse?: any;
  fundedAt?: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowInitiateResponse {
  escrowId: string;
  checkoutUrl: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
}

export interface CreateDisputeDto {
  contractId: string;
  reason: string;
  evidenceUrls: string[];
}

export interface CreateMilestoneDto {
  title: string;
  description?: string;
  amount: number;
  deadline: string;
}

export interface SubmitMilestoneDto {
  fileUrl?: string;
  notes?: string;
}

export const freelanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFreelanceCategories: builder.query<FreelanceCategory[], void>({
      query: () => '/freelance/categories',
      providesTags: ['FreelanceCategories'] as any,
    }),
    getFreelanceJobs: builder.query<{ items: FreelanceJob[]; total: number }, { q?: string; category?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/freelance/jobs',
        params,
      }),
      providesTags: ['Freelance'] as any,
    }),
    getFreelanceJob: builder.query<FreelanceJob, string>({
      query: (id) => `/freelance/jobs/${id}`,
      providesTags: (result) => [{ type: 'Freelance' as any, id: result?.id }],
    }),
    createFreelanceJob: builder.mutation<FreelanceJob, CreateFreelanceJobDto>({
      query: (dto) => ({
        url: '/freelance/jobs',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    submitBid: builder.mutation<Bid, { jobId: string; dto: CreateBidDto }>({
      query: ({ jobId, dto }) => ({
        url: `/freelance/jobs/${jobId}/bids`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    acceptBid: builder.mutation<any, string>({
      query: (bidId) => ({
        url: `/freelance/bids/${bidId}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    getMyBids: builder.query<Bid[], void>({
      query: () => '/freelance/my-bids',
      providesTags: ['Freelance'] as any,
    }),
    getMyContracts: builder.query<Contract[], void>({
      query: () => '/freelance/my-contracts',
      providesTags: ['Freelance'] as any,
    }),
    getContract: builder.query<Contract, string>({
      query: (id) => `/freelance/contracts/${id}`,
      providesTags: (result) => [{ type: 'Freelance' as any, id: result?.id }],
    }),
    approveMilestone: builder.mutation<Milestone, string>({
      query: (id) => ({
        url: `/freelance/milestones/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    startMilestone: builder.mutation<Milestone, string>({
      query: (id) => ({
        url: `/freelance/milestones/${id}/start`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    submitMilestone: builder.mutation<{ milestone: Milestone; deliverable: Deliverable }, { id: string; dto: SubmitMilestoneDto }>({
      query: ({ id, dto }) => ({
        url: `/freelance/milestones/${id}/submit`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    requestRevision: builder.mutation<Milestone, string>({
      query: (id) => ({
        url: `/freelance/milestones/${id}/revision`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    createMilestone: builder.mutation<Milestone, { contractId: string; dto: CreateMilestoneDto }>({
      query: ({ contractId, dto }) => ({
        url: `/freelance/contracts/${contractId}/milestones`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    initiateEscrow: builder.mutation<EscrowInitiateResponse, string>({
      query: (gigId) => ({
        url: `/escrow/initiate/${gigId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    releaseMilestone: builder.mutation<any, string>({
      query: (milestoneId) => ({
        url: `/escrow/milestones/${milestoneId}/release`,
        method: 'POST',
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
    createDispute: builder.mutation<any, CreateDisputeDto>({
      query: (dto) => ({
        url: `/freelance/disputes`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Freelance'] as any,
    }),
  }),
});

export const {
  useGetFreelanceJobsQuery,
  useGetFreelanceJobQuery,
  useGetFreelanceCategoriesQuery,
  useCreateFreelanceJobMutation,
  useSubmitBidMutation,
  useAcceptBidMutation,
  useGetMyBidsQuery,
  useGetMyContractsQuery,
  useGetContractQuery,
  useApproveMilestoneMutation,
  useStartMilestoneMutation,
  useSubmitMilestoneMutation,
  useRequestRevisionMutation,
  useCreateMilestoneMutation,
  useInitiateEscrowMutation,
  useReleaseMilestoneMutation,
  useCreateDisputeMutation,
} = freelanceApi;
