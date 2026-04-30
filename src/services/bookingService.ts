import axios from 'axios';
import apiClient from '@/services/apiClient';
import { Booking, BookingApiRecord, BookingListResponse, CreateBookingRequest, CreateBookingResponse } from '@/types';

function handleBookingApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; error?: unknown }
      | string
      | undefined;

    const message =
      (typeof data === 'object' && data && typeof data.message === 'string' && data.message) ||
      (typeof data === 'object' && data && typeof data.error === 'string' && data.error) ||
      (typeof data === 'string' && data) ||
      error.message ||
      fallback;

    throw new Error(message);
  }

  throw new Error(error instanceof Error ? error.message : fallback);
}

function mapApiStatus(status?: string): Booking['status'] {
  if (!status) return 'Upcoming';

  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'Active';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
  return 'Upcoming';
}

function mapApiBookingToBooking(record: BookingApiRecord): Booking {
  return {
    id: String(record.id),
    customerName: `Customer #${record.customer_id}`,
    customerPhone: '-',
    startDate: record.pickup_datetime.slice(0, 10),
    endDate: record.dropoff_datetime.slice(0, 10),
    assignedCarId: String(record.vehicle_id),
    totalPrice: Number(record.total_payment ?? 0),
    status: mapApiStatus(record.status),
  };
}

let bookings: Booking[] = [];

export const bookingService = {
  getAll: async (): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<BookingListResponse>('/api/booking/list');
      const apiData = response.data;

      if (!apiData.success) {
        throw new Error(apiData.message || 'Failed to fetch bookings');
      }

      bookings = Array.isArray(apiData.data) ? apiData.data.map(mapApiBookingToBooking) : [];
      return [...bookings];
    } catch (error) {
      handleBookingApiError(error, 'Failed to fetch bookings');
    }
  },
  getById: async (id: string): Promise<Booking | undefined> => bookings.find(b => b.id === id),
  create: async (payload: CreateBookingRequest): Promise<Booking> => {
    try {
      const response = await apiClient.post<CreateBookingResponse>('/api/booking/create', payload);
      const apiData = response.data;

      if (apiData.success && apiData.data) {
        const mapped = mapApiBookingToBooking(apiData.data);
        bookings = [mapped, ...bookings];
        return mapped;
      }

      throw new Error(apiData.message || 'Failed to create booking');
    } catch (error) {
      handleBookingApiError(error, 'Failed to create booking');
    }
  },
  update: async (booking: Booking): Promise<Booking> => { bookings = bookings.map(b => b.id === booking.id ? booking : b); return booking; },
  delete: async (id: string): Promise<void> => { bookings = bookings.filter(b => b.id !== id); },
};
