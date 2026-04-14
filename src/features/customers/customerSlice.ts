import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';
import { customerService } from '@/services/customerService';
import { CreateCustomerRequest, Customer, SliceState } from '@/types';

const initialState: SliceState<Customer> = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk('customers/fetchAll', () => customerService.getAll());
export const createCustomerApi = createAsyncThunk(
  'customers/create',
  (payload: CreateCustomerRequest) => customerService.create(payload)
);

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomer: (state, action) => {
      state.selectedItem = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      .addCase(createCustomerApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomerApi.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createCustomerApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create customer';
      });
  },
});

export const { setSelectedCustomer } = customerSlice.actions;
export const selectAllCustomers = (state: RootState) => state.customers.items;
export const selectCustomersLoading = (state: RootState) => state.customers.loading;
export const selectCustomersError = (state: RootState) => state.customers.error;
export default customerSlice.reducer;