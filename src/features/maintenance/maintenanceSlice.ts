import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MaintenanceJob, SliceState } from '@/types';
import { maintenanceService } from '@/services/maintenanceService';
import { RootState } from '@/app/store';

const initialState: SliceState<MaintenanceJob> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchMaintenance = createAsyncThunk('maintenance/fetchAll', () => maintenanceService.getAll());
export const createMaintenanceJob = createAsyncThunk('maintenance/create', (j: Omit<MaintenanceJob, 'id'>) => maintenanceService.create(j));
export const updateMaintenanceJob = createAsyncThunk('maintenance/update', (j: MaintenanceJob) => maintenanceService.update(j));
export const deleteMaintenanceJob = createAsyncThunk('maintenance/delete', (id: string) => maintenanceService.delete(id).then(() => id));

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMaintenance.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchMaintenance.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createMaintenanceJob.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateMaintenanceJob.fulfilled, (s, a) => { s.items = s.items.map(j => j.id === a.payload.id ? a.payload : j); })
      .addCase(deleteMaintenanceJob.fulfilled, (s, a) => { s.items = s.items.filter(j => j.id !== a.payload); });
  },
});

export const selectAllMaintenance = (state: RootState) => state.maintenance.items;
export const selectUpcomingServices = (state: RootState) => {
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return state.maintenance.items.filter(j => j.status !== 'Completed' && new Date(j.scheduledDate) <= week);
};
export const selectMaintenanceLoading = (state: RootState) => state.maintenance.loading;
export default maintenanceSlice.reducer;
