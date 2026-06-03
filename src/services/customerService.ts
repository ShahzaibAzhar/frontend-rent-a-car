import axios from 'axios';
import apiClient from '@/services/apiClient';
import { getErrorMessage } from '@/lib/errorMessage';
import {
  CreateCustomerRequest,
  CreateCustomerResponse,
  Customer,
  CustomerListResponse,
} from '@/types';

function handleCustomerApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const message = getErrorMessage(error.response?.data ?? error, fallback);
    throw new Error(message);
  }

  throw new Error(getErrorMessage(error, fallback));
}

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get<CustomerListResponse>('/api/customer/list');
      const apiData = response.data;

      if (!apiData.success) {
        throw new Error(apiData.message || 'Failed to fetch customers');
      }

      return Array.isArray(apiData.data) ? apiData.data : [];
    } catch (error) {
      handleCustomerApiError(error, 'Failed to fetch customers');
    }
  },

  create: async (payload: CreateCustomerRequest): Promise<Customer> => {
    try {
      const response = await apiClient.post<CreateCustomerResponse>('/api/customer/create', payload);
      const apiData = response.data;

      if (apiData.success && apiData.data) {
        return apiData.data;
      }

      throw new Error(apiData.message || 'Failed to create customer');
    } catch (error) {
      handleCustomerApiError(error, 'Failed to create customer');
    }
  },
};