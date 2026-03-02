import { Fine } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let fines: Fine[] = [
  { id: '1', carId: '2', issueDate: '2026-02-01', dueDate: '2026-03-01', amount: 65, status: 'Unpaid' },
  { id: '2', carId: '7', issueDate: '2026-01-15', dueDate: '2026-02-15', amount: 130, status: 'Paid' },
  { id: '3', carId: '9', issueDate: '2026-02-10', dueDate: '2026-03-10', amount: 35, status: 'Unpaid' },
  { id: '4', carId: '1', issueDate: '2026-02-18', dueDate: '2026-03-18', amount: 80, status: 'Disputed' },
  { id: '5', carId: '5', issueDate: '2026-01-28', dueDate: '2026-02-28', amount: 45, status: 'Unpaid' },
];

let nextId = 6;

export const finesService = {
  getAll: async (): Promise<Fine[]> => { await delay(); return [...fines]; },
  getById: async (id: string): Promise<Fine | undefined> => { await delay(200); return fines.find(f => f.id === id); },
  create: async (fine: Omit<Fine, 'id'>): Promise<Fine> => { await delay(); const n = { ...fine, id: String(nextId++) }; fines.push(n); return n; },
  update: async (fine: Fine): Promise<Fine> => { await delay(); fines = fines.map(f => f.id === fine.id ? fine : f); return fine; },
  delete: async (id: string): Promise<void> => { await delay(200); fines = fines.filter(f => f.id !== id); },
};
