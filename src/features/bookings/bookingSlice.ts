import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Booking, BookingStatus, CreateBookingRequest, SliceState } from '@/types';
import { bookingService } from '@/services/bookingService';
import { RootState } from '@/app/store';

const initialState: SliceState<Booking> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchBookings = createAsyncThunk('bookings/fetchAll', () => bookingService.getAll());
export const createBooking = createAsyncThunk('bookings/create', (b: CreateBookingRequest) => bookingService.create(b));
export const deleteBooking = createAsyncThunk('bookings/delete', (id: string) => bookingService.delete(id).then(() => id));

export const refreshBookingById = createAsyncThunk('bookings/refreshById', (id: string) => bookingService.getById(id));

export const uploadCustomerDocuments = createAsyncThunk(
  'bookings/uploadCustomerDocuments',
  async ({ bookingId, files }: { bookingId: string; files: File[] }) => {
    await bookingService.uploadBookingFiles(bookingId, 'customer_insurance', files);
    return bookingService.getById(bookingId);
  },
);

export const approveBookingDocuments = createAsyncThunk('bookings/approveDocuments', async (bookingId: string) => {
  await bookingService.markDocumentsApproved(bookingId);
  return bookingService.getById(bookingId);
});

export const generateBookingAgreement = createAsyncThunk('bookings/generateAgreement', async (bookingId: string) => {
  await bookingService.generateAgreement(bookingId);
  return bookingService.getById(bookingId);
});

export const signBookingAgreement = createAsyncThunk(
  'bookings/signAgreement',
  async ({ bookingId, signature }: { bookingId: string; signature: File }) => {
    await bookingService.signAgreement(bookingId, signature);
    return bookingService.getById(bookingId);
  },
);

export const completeBookingHandover = createAsyncThunk(
  'bookings/completeHandover',
  async ({ bookingId, pictures, signature }: { bookingId: string; pictures: File[]; signature: File }) => {
    await bookingService.uploadBookingFiles(bookingId, 'handover_pictures', pictures);
    await bookingService.uploadBookingFiles(bookingId, 'handover_signature', [signature]);
    return bookingService.setStatus(bookingId, 'waiting customer confirmation');
  },
);

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
      .addCase(refreshBookingById.fulfilled, (s, a) => {
        if (!a.payload) return;
        s.items = s.items.map((b) => (b.id === a.payload?.id ? a.payload : b));
      })
      .addCase(uploadCustomerDocuments.fulfilled, (s, a) => { if (!a.payload) return; s.items = s.items.map(b => b.id === a.payload?.id ? a.payload : b); })
      .addCase(approveBookingDocuments.fulfilled, (s, a) => { s.items = s.items.map(b => b.id === a.payload.id ? a.payload : b); })
      .addCase(generateBookingAgreement.fulfilled, (s, a) => { s.items = s.items.map(b => b.id === a.payload.id ? a.payload : b); })
      .addCase(signBookingAgreement.fulfilled, (s, a) => { s.items = s.items.map(b => b.id === a.payload.id ? a.payload : b); })
      .addCase(completeBookingHandover.fulfilled, (s, a) => { s.items = s.items.map(b => b.id === a.payload.id ? a.payload : b); })
      .addCase(deleteBooking.fulfilled, (s, a) => { s.items = s.items.filter(b => b.id !== a.payload); });
  },
});

export const { setSelectedBooking } = bookingSlice.actions;
export const selectAllBookings = (state: RootState) => state.bookings.items;
export const selectActiveBookings = (state: RootState) => state.bookings.items.filter(b => b.status !== 'done');
export const selectBookingsLoading = (state: RootState) => state.bookings.loading;
export default bookingSlice.reducer;
