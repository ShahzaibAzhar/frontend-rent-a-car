import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Fine, SliceState } from '@/types';
import { finesService } from '@/services/finesService';
import { RootState } from '@/app/store';

const initialState: SliceState<Fine> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchFines = createAsyncThunk('fines/fetchAll', () => finesService.getAll());
export const fetchFineById = createAsyncThunk('fines/fetchById', (id: string) => finesService.getById(id));
export const createFine = createAsyncThunk('fines/create', (f: Omit<Fine, 'id'>) => finesService.create(f));
export const updateFine = createAsyncThunk('fines/update', (f: Fine) => finesService.update(f));

const finesSlice = createSlice({
  name: 'fines',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFines.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchFines.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchFines.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(fetchFineById.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchFineById.fulfilled, (s, a) => {
        s.loading = false;
        if (!a.payload) return;
        const exists = s.items.some((fine) => fine.id === a.payload?.id);
        s.items = exists ? s.items.map((fine) => fine.id === a.payload?.id ? a.payload : fine) : [a.payload, ...s.items];
      })
      .addCase(fetchFineById.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createFine.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(createFine.fulfilled, (s, a) => { s.loading = false; s.items.push(a.payload); })
      .addCase(createFine.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(updateFine.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(updateFine.fulfilled, (s, a) => { s.loading = false; s.items = s.items.map(f => f.id === a.payload.id ? a.payload : f); })
      .addCase(updateFine.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; });
  },
});

export const selectAllFines = (state: RootState) => state.fines.items;
export const selectUnpaidFines = (state: RootState) => state.fines.items.filter(f => f.status === 'Unpaid');
export const selectTotalUnpaidAmount = (state: RootState) => state.fines.items.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);
export const selectFinesLoading = (state: RootState) => state.fines.loading;
export default finesSlice.reducer;
