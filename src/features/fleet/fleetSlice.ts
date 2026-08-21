import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Car, SliceState } from '@/types';
import { fleetService, getDvlaInfo, createVehicle } from '@/services/fleetService';
import { RootState } from '@/app/store';

interface FleetState extends SliceState<Car> {
  rollbackById: Record<string, Car | null>;
}

const initialState: FleetState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  rollbackById: {},
};

export const fetchCars = createAsyncThunk('fleet/fetchAll', () => fleetService.getAll());
export const fetchCarByRegistrationNumber = createAsyncThunk('fleet/fetchByRegNumber', (registrationNumber: string) => getDvlaInfo({ registration_number: registrationNumber }));
export const createCar = createAsyncThunk('fleet/create', (car: Omit<Car, 'id'>) => fleetService.create(car));
export const createVehicleApi = createAsyncThunk('fleet/createApi', (car: Omit<Car, 'id'>) => createVehicle(car));
export const updateCar = createAsyncThunk('fleet/update', (car: Car) => fleetService.update(car));
export const deleteCar = createAsyncThunk('fleet/delete', (id: string) => fleetService.delete(id).then(() => id));

const fleetSlice = createSlice({
  name: 'fleet',
  initialState,
  reducers: { setSelectedCar: (state, action) => { state.selectedItem = action.payload; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCars.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCars.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchCars.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(fetchCarByRegistrationNumber.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCarByRegistrationNumber.fulfilled, (s, a) => { s.loading = false; s.selectedItem = a.payload || null; })
      .addCase(fetchCarByRegistrationNumber.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createCar.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(createVehicleApi.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateCar.pending, (s, a) => {
        const incoming = a.meta.arg;
        const existing = s.items.find((car) => car.id === incoming.id) || null;
        s.rollbackById[incoming.id] = existing;
        s.items = s.items.map((car) => (car.id === incoming.id ? incoming : car));
      })
      .addCase(updateCar.fulfilled, (s, a) => {
        s.items = s.items.map(c => c.id === a.payload.id ? a.payload : c);
        delete s.rollbackById[a.payload.id];
      })
      .addCase(updateCar.rejected, (s, a) => {
        const incoming = a.meta.arg;
        const rollback = s.rollbackById[incoming.id];
        if (rollback) {
          s.items = s.items.map((car) => (car.id === incoming.id ? rollback : car));
        }
        delete s.rollbackById[incoming.id];
        s.error = a.error.message || 'Failed';
      })
      .addCase(deleteCar.pending, (s, a) => {
        const id = a.meta.arg;
        const existing = s.items.find((car) => car.id === id) || null;
        s.rollbackById[id] = existing;
        s.items = s.items.filter((car) => car.id !== id);
      })
      .addCase(deleteCar.fulfilled, (s, a) => {
        delete s.rollbackById[a.payload];
      })
      .addCase(deleteCar.rejected, (s, a) => {
        const id = a.meta.arg;
        const rollback = s.rollbackById[id];
        if (rollback) {
          s.items.push(rollback);
        }
        delete s.rollbackById[id];
        s.error = a.error.message || 'Failed';
      });
  },
});

export const { setSelectedCar } = fleetSlice.actions;
export const selectAllCars = (state: RootState) => state.fleet.items;
export const selectAvailableCars = (state: RootState) => state.fleet.items.filter(c => c.status === 'Available');
export const selectFleetLoading = (state: RootState) => state.fleet.loading;
export const selectSelectedCar = (state: RootState) => state.fleet.selectedItem;
export const selectFleetError = (state: RootState) => state.fleet.error;
export default fleetSlice.reducer;
