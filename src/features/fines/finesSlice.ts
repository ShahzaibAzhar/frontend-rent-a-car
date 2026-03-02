import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Fine, SliceState } from '@/types';
import { finesService } from '@/services/finesService';
import { RootState } from '@/app/store';

const initialState: SliceState<Fine> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchFines = createAsyncThunk('fines/fetchAll', () => finesService.getAll());
export const createFine = createAsyncThunk('fines/create', (f: Omit<Fine, 'id'>) => finesService.create(f));
export const updateFine = createAsyncThunk('fines/update', (f: Fine) => finesService.update(f));
export const deleteFine = createAsyncThunk('fines/delete', (id: string) => finesService.delete(id).then(() => id));

const finesSlice = createSlice({
  name: 'fines',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFines.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchFines.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchFines.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createFine.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateFine.fulfilled, (s, a) => { s.items = s.items.map(f => f.id === a.payload.id ? a.payload : f); })
      .addCase(deleteFine.fulfilled, (s, a) => { s.items = s.items.filter(f => f.id !== a.payload); });
  },
});

export const selectAllFines = (state: RootState) => state.fines.items;
export const selectUnpaidFines = (state: RootState) => state.fines.items.filter(f => f.status === 'Unpaid');
export const selectTotalUnpaidAmount = (state: RootState) => state.fines.items.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);
export const selectFinesLoading = (state: RootState) => state.fines.loading;
export default finesSlice.reducer;
