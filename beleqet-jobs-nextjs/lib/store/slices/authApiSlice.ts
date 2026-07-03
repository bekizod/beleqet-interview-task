import { api } from '../api';
import { setCredentials, logout, setLoading } from './authSlice';

export interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: 'ADMIN' | 'EMPLOYER' | 'JOB_SEEKER' | 'FREELANCER';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'EMPLOYER' | 'JOB_SEEKER' | 'FREELANCER';
  };
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterDto>({
      query: (dto) => ({
        url: '/auth/register',
        method: 'POST',
        body: dto,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error) {
          console.error('Registration failed:', error);
        }
      },
    }),
    login: builder.mutation<AuthResponse, LoginDto>({
      query: (dto) => ({
        url: '/auth/login',
        method: 'POST',
        body: dto,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error) {
          dispatch(setLoading(false));
          console.error('Login failed:', error);
        }
      },
    }),
    refresh: builder.mutation<AuthResponse, RefreshDto>({
      query: (dto) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: dto,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error) {
          dispatch(logout());
          console.error('Token refresh failed:', error);
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
        } catch (error) {
          dispatch(logout());
          console.error('Logout failed:', error);
        }
      },
    }),
    me: builder.query<AuthResponse['user'], void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    verifyEmail: builder.mutation<{ success: boolean; message: string }, VerifyEmailDto>({
      query: (dto) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: dto,
      }),
    }),
    forgotPassword: builder.mutation<{ success: boolean; message: string }, ForgotPasswordDto>({
      query: (dto) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: dto,
      }),
    }),
    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordDto>({
      query: (dto) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: dto,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
