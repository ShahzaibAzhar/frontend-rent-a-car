import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/types';
import { authService } from '@/services/authService';
import { RootState } from '@/app/store';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { user: null, token: null, loading: false, error: null };

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }: { email: string; password: string }) => {
  return authService.login(email, password);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => { state.user = null; state.token = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Login failed'; });
  },
});

export const { logout } = authSlice.actions;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export default authSlice.reducer;
