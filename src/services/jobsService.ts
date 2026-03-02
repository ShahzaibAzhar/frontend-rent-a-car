import { PickupDeliveryJob } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let jobs: PickupDeliveryJob[] = [
  { id: '1', bookingId: '1', driverName: 'John Smith', type: 'Pickup', scheduledTime: '2026-02-23T09:00:00', status: 'Pending' },
  { id: '2', bookingId: '1', driverName: 'John Smith', type: 'Delivery', scheduledTime: '2026-02-27T14:00:00', status: 'Pending' },
  { id: '3', bookingId: '4', driverName: 'Steve Rogers', type: 'Pickup', scheduledTime: '2026-02-23T11:00:00', status: 'In Progress' },
  { id: '4', bookingId: '2', driverName: 'Tony Stark', type: 'Pickup', scheduledTime: '2026-03-01T10:00:00', status: 'Pending' },
  { id: '5', bookingId: '7', driverName: 'Steve Rogers', type: 'Pickup', scheduledTime: '2026-02-23T08:30:00', status: 'Completed' },
  { id: '6', bookingId: '7', driverName: 'John Smith', type: 'Delivery', scheduledTime: '2026-02-28T16:00:00', status: 'Pending' },
];

let nextId = 7;

export const jobsService = {
  getAll: async (): Promise<PickupDeliveryJob[]> => { await delay(); return [...jobs]; },
  getById: async (id: string): Promise<PickupDeliveryJob | undefined> => { await delay(200); return jobs.find(j => j.id === id); },
  create: async (job: Omit<PickupDeliveryJob, 'id'>): Promise<PickupDeliveryJob> => { await delay(); const n = { ...job, id: String(nextId++) }; jobs.push(n); return n; },
  update: async (job: PickupDeliveryJob): Promise<PickupDeliveryJob> => { await delay(); jobs = jobs.map(j => j.id === job.id ? job : j); return job; },
  delete: async (id: string): Promise<void> => { await delay(200); jobs = jobs.filter(j => j.id !== id); },
};
