import { MaintenanceJob } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let jobs: MaintenanceJob[] = [
  { id: '1', carId: '3', serviceType: 'Oil Change', description: 'Full oil and filter change', scheduledDate: '2026-02-24', completedDate: null, cost: 85, status: 'In Progress' },
  { id: '2', carId: '10', serviceType: 'Brake Inspection', description: 'Front and rear brake pads check', scheduledDate: '2026-02-25', completedDate: null, cost: 120, status: 'Scheduled' },
  { id: '3', carId: '5', serviceType: 'Tire Rotation', description: 'Rotate all four tires', scheduledDate: '2026-03-01', completedDate: null, cost: 45, status: 'Scheduled' },
  { id: '4', carId: '1', serviceType: 'Annual Service', description: 'Full annual inspection and service', scheduledDate: '2026-03-05', completedDate: null, cost: 250, status: 'Scheduled' },
  { id: '5', carId: '7', serviceType: 'Battery Replacement', description: 'Replace 12V battery', scheduledDate: '2026-02-15', completedDate: '2026-02-15', cost: 95, status: 'Completed' },
  { id: '6', carId: '2', serviceType: 'Windscreen Repair', description: 'Fix stone chip on windscreen', scheduledDate: '2026-02-28', completedDate: null, cost: 65, status: 'Scheduled' },
];

let nextId = 7;

export const maintenanceService = {
  getAll: async (): Promise<MaintenanceJob[]> => { await delay(); return [...jobs]; },
  getById: async (id: string): Promise<MaintenanceJob | undefined> => { await delay(200); return jobs.find(j => j.id === id); },
  create: async (job: Omit<MaintenanceJob, 'id'>): Promise<MaintenanceJob> => { await delay(); const n = { ...job, id: String(nextId++) }; jobs.push(n); return n; },
  update: async (job: MaintenanceJob): Promise<MaintenanceJob> => { await delay(); jobs = jobs.map(j => j.id === job.id ? job : j); return job; },
  delete: async (id: string): Promise<void> => { await delay(200); jobs = jobs.filter(j => j.id !== id); },
};
