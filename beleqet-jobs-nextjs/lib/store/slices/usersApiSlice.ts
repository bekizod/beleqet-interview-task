import { api } from '../api';

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  telegramId?: string;
  headline?: string;
  bio?: string;
  location?: string;
  defaultResumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
}

export interface CreateCompanyDto {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  coverImageUrl?: string;
  benefits?: string[];
  foundedYear?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
  telegramId?: string;
  createdAt: string;
  company?: Company;
  headline?: string;
  bio?: string;
  location?: string;
  defaultResumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
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
  benefits?: string[];
  coverImageUrl?: string;
  facebookUrl?: string;
  foundedYear?: number;
  linkedinUrl?: string;
  location?: string;
  twitterUrl?: string;
  jobs?: any[];
}

export interface Notification {
  id: string;
  userId: string;
  channel: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<User, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<User, UpdateUserDto>({
      query: (dto) => ({
        url: '/users/profile',
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: ['User'],
    }),
    getCompany: builder.query<Company, void>({
      query: () => '/users/company',
      providesTags: ['Company'],
    }),
    createCompany: builder.mutation<Company, CreateCompanyDto>({
      query: (dto) => ({
        url: '/users/company',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Company', 'User'],
    }),
    getNotifications: builder.query<Notification[], void>({
      query: () => '/users/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} = usersApi;
