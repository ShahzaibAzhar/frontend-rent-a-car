import { User } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@fleet.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Staff User', email: 'staff@fleet.com', role: 'Staff', status: 'Active' },
];

export const authService = {
  login: async (email: string, _password: string): Promise<{ user: User; token: string }> => {
    await delay(600);
    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    return { user, token: `mock-jwt-${user.id}` };
  },
  getUsers: async (): Promise<User[]> => { await delay(); return [...mockUsers]; },
};
