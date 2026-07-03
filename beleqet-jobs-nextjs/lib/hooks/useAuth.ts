'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { logout, setCredentials } from '@/lib/store/slices/authSlice';
import { useRefreshMutation, useLogoutMutation } from '@/lib/store/slices/authApiSlice';
import { useEffect, useRef } from 'react';
import Cookies from "js-cookie";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { accessToken, refreshToken, user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const [refreshTokenMutation] = useRefreshMutation();
  const [logoutMutation] = useLogoutMutation();
  const refreshAttempted = useRef(false);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      if (typeof window !== 'undefined') {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      }
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken || refreshAttempted.current) return null;
    
    refreshAttempted.current = true;
    try {
      const result = await refreshTokenMutation({ refreshToken }).unwrap();
      dispatch(setCredentials(result));
      if (typeof window !== 'undefined') {
        Cookies.set('accessToken', result.accessToken);
        Cookies.set('refreshToken', result.refreshToken);
      }
      return result.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
      return null;
    }
  };

  // Initialize auth from cookies on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAccessToken = Cookies.get('accessToken');
      const storedRefreshToken = Cookies.get('refreshToken');
      const storedUser = Cookies.get('user');

      if (storedAccessToken && storedRefreshToken && storedUser && !isAuthenticated) {
        try {
          const user = JSON.parse(storedUser);
          dispatch(
            setCredentials({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              user,
            })
          );
        } catch (error) {
          console.error('Failed to parse stored user:', error);
        }
      }
    }
  }, [dispatch, isAuthenticated]);

  // Persist auth state to cookies whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (accessToken && refreshToken && user) {
        Cookies.set('accessToken', accessToken);
        Cookies.set('refreshToken', refreshToken);
        Cookies.set('user', JSON.stringify(user));
      } else {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
      }
    }
  }, [accessToken, refreshToken, user]);

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    refreshAccessToken,
  };
};
