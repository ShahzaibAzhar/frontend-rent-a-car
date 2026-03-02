import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PickupDeliveryJob, SliceState } from '@/types';
import { jobsService } from '@/services/jobsService';
import { RootState } from '@/app/store';

const initialState: SliceState<PickupDeliveryJob> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchJobs = createAsyncThunk('jobs/fetchAll', () => jobsService.getAll());
export const createJob = createAsyncThunk('jobs/create', (j: Omit<PickupDeliveryJob, 'id'>) => jobsService.create(j));
export const updateJob = createAsyncThunk('jobs/update', (j: PickupDeliveryJob) => jobsService.update(j));
export const deleteJob = createAsyncThunk('jobs/delete', (id: string) => jobsService.delete(id).then(() => id));

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchJobs.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchJobs.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createJob.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateJob.fulfilled, (s, a) => { s.items = s.items.map(j => j.id === a.payload.id ? a.payload : j); })
      .addCase(deleteJob.fulfilled, (s, a) => { s.items = s.items.filter(j => j.id !== a.payload); });
  },
});

export const selectAllJobs = (state: RootState) => state.jobs.items;
export const selectTodayJobs = (state: RootState) => {
  const today = new Date().toISOString().split('T')[0];
  return state.jobs.items.filter(j => j.scheduledTime.startsWith(today));
};
export const selectJobsLoading = (state: RootState) => state.jobs.loading;
export default jobsSlice.reducer;
