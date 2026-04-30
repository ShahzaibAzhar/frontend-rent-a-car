import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Booking, CreateBookingRequest, SliceState } from '@/types';
import { bookingService } from '@/services/bookingService';
import { RootState } from '@/app/store';

const initialState: SliceState<Booking> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchBookings = createAsyncThunk('bookings/fetchAll', () => bookingService.getAll());
export const createBooking = createAsyncThunk('bookings/create', (b: CreateBookingRequest) => bookingService.create(b));
export const updateBooking = createAsyncThunk('bookings/update', (b: Booking) => bookingService.update(b));
export const deleteBooking = createAsyncThunk('bookings/delete', (id: string) => bookingService.delete(id).then(() => id));

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: { setSelectedBooking: (state, action) => { state.selectedItem = action.payload; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchBookings.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchBookings.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createBooking.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateBooking.fulfilled, (s, a) => { s.items = s.items.map(b => b.id === a.payload.id ? a.payload : b); })
      .addCase(deleteBooking.fulfilled, (s, a) => { s.items = s.items.filter(b => b.id !== a.payload); });
  },
});

export const { setSelectedBooking } = bookingSlice.actions;
export const selectAllBookings = (state: RootState) => state.bookings.items;
export const selectActiveBookings = (state: RootState) => state.bookings.items.filter(b => b.status === 'Active');
export const selectBookingsLoading = (state: RootState) => state.bookings.loading;
export default bookingSlice.reducer;
