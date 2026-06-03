import axios from 'axios';
import apiClient from '@/services/apiClient';
import { getErrorMessage } from '@/lib/errorMessage';
import {
  BOOKING_STATUS_ORDER,
  Booking,
  BookingApiRecord,
  BookingDocument,
  BookingFileRecord,
  BookingListResponse,
  BookingStatus,
  CreateBookingRequest,
  CreateBookingResponse,
} from '@/types';

function handleBookingApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const message = getErrorMessage(error.response?.data ?? error, fallback);
    throw new Error(message);
  }

  throw new Error(getErrorMessage(error, fallback));
}

function normalizeStatusValue(value?: string | null): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function mapApiStatus(record: BookingApiRecord): BookingStatus {
  const normalizedStatus = normalizeStatusValue(record.status);
  const normalizedDocStatus = normalizeStatusValue(record.customer_document_status);
  const normalizedAgreementStatus = normalizeStatusValue(record.agreement_signing_status);

  if (normalizedStatus === 'canceled' || normalizedStatus === 'cancelled' || normalizedStatus === 'completed') {
    return 'done';
  }

  if (normalizedAgreementStatus === 'signed' || Boolean(record.agreement_signed_at)) {
    return 'pending handover';
  }

  if (
    normalizedAgreementStatus === 'pending' ||
    normalizedAgreementStatus === 'requested' ||
    normalizedAgreementStatus === 'generated' ||
    normalizedAgreementStatus === 'unsigned'
  ) {
    return 'pending agreement signing';
  }

  if (normalizedDocStatus === 'approved') {
    return 'documents approved';
  }

  if (
    normalizedDocStatus === 'pending' ||
    normalizedDocStatus === 'under review' ||
    normalizedDocStatus === 'submitted' ||
    normalizedDocStatus === 'review'
  ) {
    return 'pending document review';
  }

  if (normalizedStatus === 'confirmed') {
    return 'documents approved';
  }

  const matched = BOOKING_STATUS_ORDER.find((value) => value === normalizedStatus);
  return matched || 'pending';
}

function mapBookingDocuments(files?: BookingFileRecord[]): BookingDocument[] {
  if (!Array.isArray(files)) return [];

  return files
    .filter((file) => typeof file.file_path === 'string' && file.file_path.trim())
    .map((file) => ({
      id: String(file.id),
      name: file.file_name || `Document ${file.id}`,
      url: file.file_path as string,
      type: file.file_type || 'document',
      mimeType: file.mime_type || 'application/octet-stream',
      uploadedAt: file.created_at || '',
    }));
}

function mapApiBookingToBooking(record: BookingApiRecord): Booking {
  const pickupDateTime = record.pickup_datetime || '';
  const dropoffDateTime = record.dropoff_datetime || '';
  const firstName = record.customer?.first_name?.trim() || '';
  const lastName = record.customer?.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: String(record.id),
    customerId: String(record.customer_id),
    customerName: fullName || `Customer #${record.customer_id}`,
    customerPhone: record.customer?.phone || '-',
    pickupDateTime,
    dropoffDateTime,
    startDate: pickupDateTime.slice(0, 10),
    endDate: dropoffDateTime.slice(0, 10),
    pickupLocation: record.pickup_location || '-',
    dropoffLocation: record.dropoff_location || '-',
    vehicleId: String(record.vehicle_id),
    assignedCarId: String(record.vehicle_id),
    totalPrice: Number(record.total_payment ?? 0),
    paidPrice: Number(record.paid_payment ?? 0),
    paymentMethod: record.payment_method || '-',
    bookingType: record.booking_type || '-',
    driverId: record.driver_id ? String(record.driver_id) : null,
    driverEndDateTime: record.driver_end_datetime,
    insuranceIncluded: Boolean(record.insurance_included),
    insurancePrice: Number(record.insurance_price ?? 0),
    paymentStatus: record.payment_status,
    status: mapApiStatus(record),
    customerDocumentStatus: record.customer_document_status || null,
    agreementSigningStatus: record.agreement_signing_status || null,
    agreementSignedAt: record.agreement_signed_at || null,
    bookingAgreement: mapBookingDocuments(record.booking_agreement),
    customerSignature: mapBookingDocuments(record.customer_signature),
    customerInsuranceDocuments: mapBookingDocuments(record.customer_insurance_documents),
    vehiclePickupPictures: mapBookingDocuments(record.vehicle_pickup_pictures),
    vehicleDropoffPictures: mapBookingDocuments(record.vehicle_dropoff_pictures),
  };
}

function updateCachedBooking(updated: Booking) {
  bookings = bookings.map((booking) => (booking.id === updated.id ? updated : booking));
}

function parseBookingRecordFromResponse(payload: unknown): BookingApiRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as Record<string, unknown>;

  if (candidate.data && typeof candidate.data === 'object') {
    const nested = candidate.data as Record<string, unknown>;
    if ('id' in nested) return nested as unknown as BookingApiRecord;
    if (nested.booking && typeof nested.booking === 'object' && 'id' in (nested.booking as Record<string, unknown>)) {
      return nested.booking as unknown as BookingApiRecord;
    }
  }

  if ('id' in candidate) return candidate as unknown as BookingApiRecord;
  return null;
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
  getById: async (id: string): Promise<Booking | undefined> => {
    try {
      const response = await apiClient.get(`/api/booking/${id}`);
      const parsed = parseBookingRecordFromResponse(response.data);

      if (parsed) {
        const mapped = mapApiBookingToBooking(parsed);
        const exists = bookings.some((booking) => booking.id === mapped.id);
        bookings = exists ? bookings.map((booking) => (booking.id === mapped.id ? mapped : booking)) : [mapped, ...bookings];
        return mapped;
      }
    } catch {
      // Fallback to local cache only when details endpoint is unavailable.
    }

    return bookings.find((booking) => booking.id === id);
  },
  setStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const applyStatusFromCache = (): Booking => {
      const current = bookings.find((booking) => booking.id === id);
      if (!current) {
        throw new Error('Booking not found in cache after status update');
      }

      const updated: Booking = { ...current, status };
      updateCachedBooking(updated);
      return updated;
    };

    const applyResponseOrFallback = (payload: unknown): Booking => {
      const parsed = parseBookingRecordFromResponse(payload);

      if (parsed) {
        const mapped = mapApiBookingToBooking(parsed);
        updateCachedBooking(mapped);
        return mapped;
      }

      return applyStatusFromCache();
    };

    try {
      const response = await apiClient.post(`/api/booking/update/${id}`, { status });
      return applyResponseOrFallback(response.data);
    } catch (error) {
      handleBookingApiError(error, 'Failed to update booking status');
    }
  },
  markDocumentsApproved: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/api/booking/${id}/documents/approved`);
    } catch (error) {
      handleBookingApiError(error, 'Failed to approve booking documents');
    }
  },
  generateAgreement: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/api/booking/agreement/${id}/generate`);
    } catch (error) {
      handleBookingApiError(error, 'Failed to generate agreement');
    }
  },
  signAgreement: async (id: string, signature: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('signature', signature);
      await apiClient.post(`/api/booking/agreement/${id}/signature`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (error) {
      handleBookingApiError(error, 'Failed to sign agreement');
    }
  },
  uploadBookingFiles: async (bookingId: string, fileType: string, files: File[]): Promise<void> => {
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('entity_type', 'booking');
      formData.append('entity_id', bookingId);
      formData.append('file_type', fileType);
      files.forEach((file) => formData.append('files', file));

      await apiClient.post('/api/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (error) {
      handleBookingApiError(error, 'Failed to upload booking files');
    }
  },
  delete: async (id: string): Promise<void> => { bookings = bookings.filter(b => b.id !== id); },
};
