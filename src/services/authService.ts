import { LoginRequest, LoginResponse } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

const mockUsers: { id: string; name: string; email: string; role: string; status: string }[] = [
  { id: '1', name: 'Admin User', email: 'admin@fleet.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Staff User', email: 'staff@fleet.com', role: 'Staff', status: 'Active' },
  { id: '3', name: 'Test User', email: 'abc@gmail.com', role: 'Admin', status: 'Active' },
];

import axios from 'axios';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse['data']['user']> => {
    try {
      const response = await axios.post<LoginResponse>(
        'https://backend-rent-a-car.onrender.com/api/auth/login',
        credentials,
        { timeout: 10000 }
      );
      const apiData = response.data;
      console.log('API raw response:', apiData);
      if (
        apiData.success &&
        apiData.data &&
        apiData.data.user &&
        typeof apiData.data.user.accessToken === 'string' &&
        apiData.data.user.accessToken.length > 0
      ) {
        return apiData.data.user;
      } else {
        throw new Error(apiData.message || 'Login failed');
      }
    } catch (error) {
      console.warn('API call failed:', error);
      throw new Error('Login failed');
    }
  },
  getUsers: async (): Promise<{ id: string; name: string; email: string; role: string; status: string }[]> => { await delay(); return [...mockUsers]; },
};
