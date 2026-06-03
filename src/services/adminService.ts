import axios from 'axios';
import { StaffMember, Driver, CreateStaffRequest, UpdateStaffRequest, CreateDriverRequest, UpdateDriverRequest } from '@/types';
import apiClient from '@/services/apiClient';

function handleApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    // Try common API error shapes in priority order
    const message: string =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      (Array.isArray(data?.errors) && data.errors.map((e: { message?: string } | string) => (typeof e === 'string' ? e : e?.message)).filter(Boolean).join(', ')) ||
      (typeof data === 'string' && data) ||
      error.message ||
      fallback;
    throw new Error(message);
  }
  throw new Error(error instanceof Error ? error.message : fallback);
}

export const adminService = {
  // ---- Staff (Employee) ----
  getAllStaff: async (): Promise<StaffMember[]> => {
    try {
      const res = await apiClient.get('/api/employee/list');
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.employees)) return data.employees;
      if (Array.isArray(data?.users)) return data.users;
      return [];
    } catch (error) {
      handleApiError(error, 'Failed to fetch staff');
    }
  },

  createStaff: async (payload: CreateStaffRequest): Promise<StaffMember> => {
    try {
      const requestBody: CreateStaffRequest = {
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        date_of_birth: payload.date_of_birth,
        gender: payload.gender,
      };

      const res = await apiClient.post('/api/employee/create', requestBody);
      const data = res.data?.data;
      return data?.employee ?? data?.user ?? data;
    } catch (error) {
      handleApiError(error, 'Failed to create staff member');
    }
  },

  updateStaff: async (id: number, payload: UpdateStaffRequest): Promise<StaffMember> => {
    try {
      const res = await apiClient.post(`/api/employee/update/${id}`, payload);
      const data = res.data?.data;
      return data?.employee ?? data?.user ?? data;
    } catch (error) {
      handleApiError(error, 'Failed to update staff member');
    }
  },

  deleteStaff: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/api/employee/delete/${id}`, {});
    } catch (error) {
      handleApiError(error, 'Failed to delete staff member');
    }
  },

  // ---- Drivers ----
  getAllDrivers: async (): Promise<Driver[]> => {
    try {
      const res = await apiClient.get('/api/driver/list');
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.drivers)) return data.drivers;
      if (Array.isArray(data?.users)) return data.users;
      return [];
    } catch (error) {
      handleApiError(error, 'Failed to fetch drivers');
    }
  },

  createDriver: async (payload: CreateDriverRequest): Promise<Driver> => {
    try {
      const requestBody: CreateDriverRequest = {
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        gender: payload.gender,
        date_of_birth: payload.date_of_birth,
        license_type: payload.license_type,
        license_expiry: payload.license_expiry,
        password: payload.password,
      };

      const res = await apiClient.post('https://backend-rent-a-car.onrender.com/api/driver/create', requestBody);
      const data = res.data?.data;
      return data?.driver ?? data;
    } catch (error) {
      handleApiError(error, 'Failed to create driver');
    }
  },

  updateDriver: async (id: number, payload: UpdateDriverRequest): Promise<Driver> => {
    try {
      const res = await apiClient.post(`/api/driver/update/${id}`, payload);
      const data = res.data?.data;
      return data?.driver ?? data;
    } catch (error) {
      handleApiError(error, 'Failed to update driver');
    }
  },

  deleteDriver: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/api/driver/delete/${id}`, {});
    } catch (error) {
      handleApiError(error, 'Failed to delete driver');
    }
  },
};

