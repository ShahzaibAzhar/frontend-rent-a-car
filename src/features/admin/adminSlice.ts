import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { StaffMember, Driver, CreateStaffRequest, UpdateStaffRequest, CreateDriverRequest, UpdateDriverRequest } from '@/types';
import { adminService } from '@/services/adminService';
import { RootState } from '@/app/store';

interface AdminState {
  staff: StaffMember[];
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = { staff: [], drivers: [], loading: false, error: null };

export const fetchStaff = createAsyncThunk('admin/fetchStaff', () => adminService.getAllStaff());
export const createStaff = createAsyncThunk('admin/createStaff', (payload: CreateStaffRequest) => adminService.createStaff(payload));
export const updateStaff = createAsyncThunk('admin/updateStaff', ({ id, payload }: { id: number; payload: UpdateStaffRequest }) => adminService.updateStaff(id, payload));
export const deleteStaff = createAsyncThunk('admin/deleteStaff', (id: number) => adminService.deleteStaff(id).then(() => id));

export const fetchDrivers = createAsyncThunk('admin/fetchDrivers', () => adminService.getAllDrivers());
export const createDriver = createAsyncThunk('admin/createDriver', (payload: CreateDriverRequest) => adminService.createDriver(payload));
export const updateDriver = createAsyncThunk('admin/updateDriver', ({ id, payload }: { id: number; payload: UpdateDriverRequest }) => adminService.updateDriver(id, payload));
export const deleteDriver = createAsyncThunk('admin/deleteDriver', (id: number) => adminService.deleteDriver(id).then(() => id));

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Staff
      .addCase(fetchStaff.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStaff.fulfilled, (s, a) => { s.loading = false; s.staff = a.payload; })
      .addCase(fetchStaff.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createStaff.fulfilled, (s, a) => { if (a.payload) s.staff.push(a.payload); })
      .addCase(updateStaff.fulfilled, (s, a) => { if (a.payload) s.staff = s.staff.map(m => m.id === a.payload.id ? a.payload : m); })
      .addCase(deleteStaff.fulfilled, (s, a) => { s.staff = s.staff.filter(m => m.id !== a.payload); })
      // Drivers
      .addCase(fetchDrivers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDrivers.fulfilled, (s, a) => { s.loading = false; s.drivers = a.payload; })
      .addCase(fetchDrivers.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createDriver.fulfilled, (s, a) => { if (a.payload) s.drivers.push(a.payload); })
      .addCase(updateDriver.fulfilled, (s, a) => { if (a.payload) s.drivers = s.drivers.map(d => d.id === a.payload.id ? a.payload : d); })
      .addCase(deleteDriver.fulfilled, (s, a) => { s.drivers = s.drivers.filter(d => d.id !== a.payload); });
  },
});

export const selectAllStaff = (state: RootState) => state.admin.staff;
export const selectAllDrivers = (state: RootState) => state.admin.drivers;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;
export default adminSlice.reducer;

