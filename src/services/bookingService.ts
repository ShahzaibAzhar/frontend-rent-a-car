import { Booking } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let bookings: Booking[] = [
  { id: '1', customerName: 'James Wilson', customerPhone: '07700 100001', startDate: '2026-02-20', endDate: '2026-02-27', assignedCarId: '2', totalPrice: 490, status: 'Active' },
  { id: '2', customerName: 'Sarah Connor', customerPhone: '07700 100002', startDate: '2026-03-01', endDate: '2026-03-05', assignedCarId: '5', totalPrice: 300, status: 'Upcoming' },
  { id: '3', customerName: 'Mike Chen', customerPhone: '07700 100003', startDate: '2026-02-10', endDate: '2026-02-15', assignedCarId: '4', totalPrice: 375, status: 'Completed' },
  { id: '4', customerName: 'Emily Davis', customerPhone: '07700 100004', startDate: '2026-02-22', endDate: '2026-03-01', assignedCarId: '7', totalPrice: 420, status: 'Active' },
  { id: '5', customerName: 'Tom Brown', customerPhone: '07700 100005', startDate: '2026-02-18', endDate: '2026-02-20', assignedCarId: '6', totalPrice: 150, status: 'Cancelled' },
  { id: '6', customerName: 'Lisa Park', customerPhone: '07700 100006', startDate: '2026-03-10', endDate: '2026-03-15', assignedCarId: '1', totalPrice: 325, status: 'Upcoming' },
  { id: '7', customerName: 'David Kim', customerPhone: '07700 100007', startDate: '2026-02-23', endDate: '2026-02-28', assignedCarId: '9', totalPrice: 350, status: 'Active' },
  { id: '8', customerName: 'Anna White', customerPhone: '07700 100008', startDate: '2026-01-15', endDate: '2026-01-20', assignedCarId: '8', totalPrice: 275, status: 'Completed' },
];

let nextId = 9;

export const bookingService = {
  getAll: async (): Promise<Booking[]> => { await delay(); return [...bookings]; },
  getById: async (id: string): Promise<Booking | undefined> => { await delay(200); return bookings.find(b => b.id === id); },
  create: async (booking: Omit<Booking, 'id'>): Promise<Booking> => { await delay(); const n = { ...booking, id: String(nextId++) }; bookings.push(n); return n; },
  update: async (booking: Booking): Promise<Booking> => { await delay(); bookings = bookings.map(b => b.id === booking.id ? booking : b); return booking; },
  delete: async (id: string): Promise<void> => { await delay(200); bookings = bookings.filter(b => b.id !== id); },
};
