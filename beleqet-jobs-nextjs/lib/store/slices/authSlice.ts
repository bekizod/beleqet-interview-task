import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Set cookies for middleware access
      if (typeof document !== 'undefined') {
        document.cookie = `accessToken=${action.payload.accessToken}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `userRole=${action.payload.user.role}; path=/; max-age=86400; SameSite=Lax`;
      }
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear cookies
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear cookies
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
      }
    },
  },
});

export const { setCredentials, logout, setLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
