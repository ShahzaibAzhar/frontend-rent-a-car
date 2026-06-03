import { configureStore } from '@reduxjs/toolkit';
import fleetReducer from '@/features/fleet/fleetSlice';
import bookingReducer from '@/features/bookings/bookingSlice';
import maintenanceReducer from '@/features/maintenance/maintenanceSlice';
import jobsReducer from '@/features/jobs/jobsSlice';
import documentsReducer from '@/features/documents/documentsSlice';
import finesReducer from '@/features/fines/finesSlice';
import authReducer from '@/features/auth/authSlice';
import adminReducer from '@/features/admin/adminSlice';
import customersReducer from '@/features/customers/customerSlice';

export const store = configureStore({
  reducer: {
    fleet: fleetReducer,
    bookings: bookingReducer,
    maintenance: maintenanceReducer,
    jobs: jobsReducer,
    documents: documentsReducer,
    fines: finesReducer,
    auth: authReducer,
    admin: adminReducer,
    customers: customersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
