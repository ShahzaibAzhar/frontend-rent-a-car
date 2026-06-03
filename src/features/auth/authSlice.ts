import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LoginRequest } from '@/types';
import { authService } from '@/services/authService';
import { RootState } from '@/app/store';

interface AuthState {
  accessToken: string | null;
  company_id: number | null;
  role: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  company_id: localStorage.getItem('company_id') ? Number(localStorage.getItem('company_id')) : null,
  role: localStorage.getItem('role'),
  email: localStorage.getItem('email'),
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk('auth/login', async (credentials: LoginRequest) => {
  return authService.login(credentials);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.accessToken = null;
      state.company_id = null;
      state.role = null;
      state.email = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('company_id');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        // Defensive check for payload structure
        const user = a.payload;
        console.log('Auth slice received user:', user);
        // Check if accessToken exists and is not empty (API returns accessToken directly on user object)
        if (user?.accessToken && typeof user.accessToken === 'string' && user.accessToken.length > 0) {
          s.accessToken = user.accessToken;
          s.company_id = user.company_id || null;
          s.role = user.role || null;
          s.email = user.email || null;
          localStorage.setItem('accessToken', user.accessToken);
          if (user.company_id) localStorage.setItem('company_id', user.company_id.toString());
          if (user.role) localStorage.setItem('role', user.role);
          if (user.email) localStorage.setItem('email', user.email);
          console.log('Auth state updated successfully with accessToken:', user.accessToken);
        } else {
          console.error('No valid accessToken found in user payload:', user);
          s.accessToken = null;
          s.company_id = null;
          s.role = null;
          s.email = null;
        }
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Login failed'; });
  },
});

export const { logout } = authSlice.actions;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectCompanyId = (state: RootState) => state.auth.company_id;
export const selectRole = (state: RootState) => state.auth.role;
export const selectEmail = (state: RootState) => state.auth.email;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.accessToken;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export default authSlice.reducer;
