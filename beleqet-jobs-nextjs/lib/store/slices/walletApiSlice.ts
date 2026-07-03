import { api } from '../api';

export enum WalletTransactionType {
  CREDIT_PENDING = 'CREDIT_PENDING',
  CREDIT_AVAILABLE = 'CREDIT_AVAILABLE',
  DEBIT_WITHDRAWAL = 'DEBIT_WITHDRAWAL',
  DEBIT_FEE = 'DEBIT_FEE',
}

export interface WithdrawDto {
  amount: number;
  bankAccount?: string;
  bankName?: string;
  accountHolder?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  note?: string;
  milestoneId?: string;
  createdAt: string;
}

export interface FreelancerWallet {
  id: string;
  userId: string;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export const walletApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWallet: builder.query<FreelancerWallet, void>({
      query: () => '/wallet',
      providesTags: ['Wallet'] as any,
    }),
    withdraw: builder.mutation<any, WithdrawDto>({
      query: (dto) => ({
        url: '/wallet/withdraw',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Wallet'] as any,
    }),
  }),
});

export const {
  useGetWalletQuery,
  useWithdrawMutation,
} = walletApi;
