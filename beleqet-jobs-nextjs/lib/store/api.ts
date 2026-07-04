import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import toast from 'react-hot-toast';
import { setCredentials, logout } from './slices/authSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth?.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
  credentials: 'include',
});

/** Dispatch logout, show a toast, and redirect to /login — all in one place. */
function handleForcedLogout(apiDispatch: any) {
  apiDispatch(logout());
  // toast runs client-side only
  if (typeof window !== 'undefined') {
    toast.error('Your session has expired. Please log in again.', { id: 'session-expired' });
    // Small delay so the toast is visible before the navigation
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  }
}

// wrapper that attempts refresh on 401 and retries original request
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error && result.error.status === 401) {
    const refreshToken = (api.getState() as any).auth?.refreshToken;

    if (!refreshToken) {
      handleForcedLogout(api.dispatch);
      return result;
    }

    try {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult?.data) {
        // Token refreshed — update store and retry the original request
        api.dispatch(setCredentials(refreshResult.data as { accessToken: string; refreshToken: string; user: any }));
        result = await baseQuery(args, api, extraOptions);

        // If the retry STILL returns 401, the session is truly dead
        if (result?.error && result.error.status === 401) {
          handleForcedLogout(api.dispatch);
        }
      } else {
        // Refresh endpoint itself returned an error
        handleForcedLogout(api.dispatch);
      }
    } catch {
      handleForcedLogout(api.dispatch);
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Job', 'Application', 'Company', 'Notification', 'Freelance', 'Wallet', 'Chat', 'Admin'],
  endpoints: () => ({}),
});
