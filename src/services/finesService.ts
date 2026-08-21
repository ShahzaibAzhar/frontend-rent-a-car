import axios from 'axios';
import { Fine, FineStatus } from '@/types';
import apiClient from '@/services/apiClient';
import { getErrorMessage } from '@/lib/errorMessage';

interface PcnApiRecord {
  id: number | string;
  booking_id?: number | string | null;
  customer_id?: number | string | null;
  vehicle_id?: number | string | null;
  pcn_ref_no?: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  datetime_of_event?: string;
  amount?: string | number;
  reason_of_charge?: string;
  location?: string;
  issue_date?: string;
  deadline_date?: string;
  paid_by?: string | null;
  paid_datetime?: string | null;
  status?: string;
  pcn_picture?: string;
  customer?: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  } | null;
  booking?: {
    id?: number | string;
    pickup_datetime?: string;
    dropoff_datetime?: string;
    pickup_location?: string;
    dropoff_location?: string;
    booking_type?: string;
    payment_method?: string;
    payment_status?: string;
    status?: string;
  } | null;
  status_history?: Array<{
    id: number | string;
    status?: string;
    updated_by_email?: string;
    updated_by_role?: string;
    note?: string;
    created_at?: string;
  }>;
}

interface PcnListResponse {
  success: boolean;
  message?: string;
  data?: PcnApiRecord[];
}

interface PcnSingleResponse {
  success: boolean;
  message?: string;
  data?: PcnApiRecord | { pcn?: PcnApiRecord };
}

type CreateFineInput = Omit<Fine, 'id'>;

function handleFinesApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const message = getErrorMessage(error.response?.data ?? error, fallback);
    throw new Error(message);
  }

  throw new Error(getErrorMessage(error, fallback));
}

function mapApiStatusToFineStatus(status?: string): FineStatus {
  const normalized = (status || '').trim().toLowerCase();
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'disputed') return 'Disputed';
  return 'Unpaid';
}

function mapFineStatusToApiStatus(status: FineStatus): string {
  return status.toLowerCase();
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapApiPcnToFine(record: PcnApiRecord): Fine {
  return {
    id: String(record.id),
    bookingId: record.booking_id ? String(record.booking_id) : undefined,
    customerId: record.customer_id ? String(record.customer_id) : undefined,
    vehicleId: record.vehicle_id ? String(record.vehicle_id) : undefined,
    pcnRefNo: record.pcn_ref_no || '',
    vehicleRegistration: record.vehicle_registration || '-',
    vehicleMake: record.vehicle_make || '',
    vehicleModel: record.vehicle_model || '',
    issueDate: record.issue_date || '',
    dueDate: record.deadline_date || '',
    amount: toNumber(record.amount),
    status: mapApiStatusToFineStatus(record.status),
    reasonOfCharge: record.reason_of_charge || '',
    location: record.location || '',
    datetimeOfEvent: record.datetime_of_event || '',
    pcnPicture: record.pcn_picture || '',
    paidBy: record.paid_by ?? null,
    paidDateTime: record.paid_datetime ?? null,
    customer: record.customer
      ? {
          id: String(record.customer.id || ''),
          firstName: record.customer.first_name || '',
          lastName: record.customer.last_name || '',
          phone: record.customer.phone || '',
        }
      : null,
    booking: record.booking
      ? {
          id: String(record.booking.id || ''),
          pickupDateTime: record.booking.pickup_datetime || '',
          dropoffDateTime: record.booking.dropoff_datetime || '',
          pickupLocation: record.booking.pickup_location || '',
          dropoffLocation: record.booking.dropoff_location || '',
          bookingType: record.booking.booking_type || '',
          paymentMethod: record.booking.payment_method || '',
          paymentStatus: record.booking.payment_status || '',
          status: record.booking.status || '',
        }
      : null,
    statusHistory: Array.isArray(record.status_history)
      ? record.status_history.map((item) => ({
          id: String(item.id),
          status: item.status || '',
          updatedByEmail: item.updated_by_email || '',
          updatedByRole: item.updated_by_role || '',
          note: item.note || '',
          createdAt: item.created_at || '',
        }))
      : [],
  };
}

function parseSingleRecord(payload: unknown): PcnApiRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    if ('id' in data) return data as unknown as PcnApiRecord;
    if (data.pcn && typeof data.pcn === 'object' && 'id' in (data.pcn as Record<string, unknown>)) {
      return data.pcn as unknown as PcnApiRecord;
    }
  }

  if ('id' in record) return record as unknown as PcnApiRecord;
  return null;
}

function toIsoDate(value: string): string {
  if (!value) return value;
  if (value.includes('T')) return value;
  return `${value}T00:00:00.000Z`;
}

let fines: Fine[] = [];

export const finesService = {
  getAll: async (): Promise<Fine[]> => {
    try {
      const response = await apiClient.get<PcnListResponse>('/api/pcn/list');
      const apiData = response.data;

      if (!apiData.success) {
        throw new Error(apiData.message || 'Failed to fetch PCNs');
      }

      fines = Array.isArray(apiData.data) ? apiData.data.map(mapApiPcnToFine) : [];
      return [...fines];
    } catch (error) {
      handleFinesApiError(error, 'Failed to fetch PCNs');
    }
  },

  getById: async (id: string): Promise<Fine | undefined> => {
    try {
      const response = await apiClient.get<PcnSingleResponse>(`/api/pcn/${id}`);
      const parsed = parseSingleRecord(response.data);

      if (parsed) {
        const mapped = mapApiPcnToFine(parsed);
        const exists = fines.some((fine) => fine.id === mapped.id);
        fines = exists ? fines.map((fine) => (fine.id === mapped.id ? mapped : fine)) : [mapped, ...fines];
        return mapped;
      }
    } catch {
      // Fallback to cache if details endpoint is unavailable.
    }

    return fines.find((fine) => fine.id === id);
  },

  create: async (fine: CreateFineInput): Promise<Fine> => {
    const pcnRefNo = (fine.pcnRefNo || '').trim();
    const vehicleRegistration = fine.vehicleRegistration.trim().toUpperCase();

    if (!pcnRefNo) throw new Error('PCN reference number is required');
    if (!vehicleRegistration) throw new Error('Vehicle registration is required');
    if (!fine.reasonOfCharge?.trim()) throw new Error('Reason of charge is required');
    if (!fine.location?.trim()) throw new Error('Location is required');
    if (!fine.issueDate) throw new Error('Issue date is required');
    if (!fine.dueDate) throw new Error('Due date is required');
    if (!Number.isFinite(fine.amount) || fine.amount <= 0) throw new Error('Amount must be greater than 0');

    try {
      const payload = {
        pcn_picture: fine.pcnPicture || '',
        pcn_ref_no: pcnRefNo,
        vehicle_registration: vehicleRegistration,
        datetime_of_event: toIsoDate(fine.datetimeOfEvent || fine.issueDate),
        amount: String(fine.amount),
        reason_of_charge: fine.reasonOfCharge,
        location: fine.location,
        issue_date: toIsoDate(fine.issueDate),
        deadline_date: toIsoDate(fine.dueDate),
      };

      const response = await apiClient.post<PcnSingleResponse>('/api/pcn/create', payload);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create PCN');
      }

      const parsed = parseSingleRecord(response.data);

      if (parsed) {
        const mapped = mapApiPcnToFine(parsed);
        fines = [mapped, ...fines];
        return mapped;
      }

      // Some backend variants return success without embedding the created record.
      const latest = await this.getAll();
      const created = latest.find((item) => item.pcnRefNo === pcnRefNo) || latest[0];
      if (created) return created;

      return {
        id: `pcn-${Date.now()}`,
        ...fine,
        pcnRefNo,
        vehicleRegistration,
      };
    } catch (error) {
      handleFinesApiError(error, 'Failed to create PCN');
    }
  },

  update: async (fine: Fine): Promise<Fine> => {
    try {
      const payload = {
        pcn_ref_no: fine.pcnRefNo,
        vehicle_registration: fine.vehicleRegistration,
        datetime_of_event: toIsoDate(fine.datetimeOfEvent || fine.issueDate),
        amount: String(fine.amount),
        reason_of_charge: fine.reasonOfCharge,
        location: fine.location,
        issue_date: toIsoDate(fine.issueDate),
        deadline_date: toIsoDate(fine.dueDate),
        status: mapFineStatusToApiStatus(fine.status),
      };

      const response = await apiClient.post<PcnSingleResponse>(`/api/pcn/update/${fine.id}`, payload);
      const parsed = parseSingleRecord(response.data);

      if (parsed) {
        const mapped = mapApiPcnToFine(parsed);
        fines = fines.map((item) => (item.id === mapped.id ? mapped : item));
        return mapped;
      }

      const updated = { ...fine };
      fines = fines.map((item) => (item.id === updated.id ? updated : item));
      return updated;
    } catch (error) {
      handleFinesApiError(error, 'Failed to update PCN');
    }
  },
};
