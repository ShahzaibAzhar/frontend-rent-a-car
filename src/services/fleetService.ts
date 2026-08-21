import axios from 'axios';
import {
  AvailableVehicleSearchRequest,
  Car,
  CreateVehicleRequest,
  CreateVehicleResponse,
  DvlaRequest,
  DvlaResponse,
  DvlaVehicleData,
  VehicleExpense,
  VehicleExpenseCreateRequest,
  VehicleExpenseListResponse,
  VehicleExpenseRecord,
  VehicleExpenseUpdateRequest,
  VehicleCouncil,
  VehicleCouncilCreateRequest,
  VehicleCouncilCreateResponse,
  VehicleCouncilListResponse,
  VehicleCouncilUpdateRequest,
  VehicleCouncilUpdateResponse,
  VehicleListItem,
  VehicleListResponse,
} from '@/types';
import apiClient from '@/services/apiClient';

function handleFleetApiError(error: unknown, fallback: string): never {
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

function shouldRetryFleetError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  const status = error.response.status;
  return status >= 500 || status === 429;
}

async function withFleetRetry<T>(request: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !shouldRetryFleetError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export const mapVehicleToCar = (vehicle: VehicleListItem): Car => {
  const model = vehicle.model ?? '';
  const derivedMake = model.trim().split(' ')[0];
  const mileage = typeof vehicle.mileage === 'string' ? Number(vehicle.mileage) : Number(vehicle.mileage ?? 0);
  const seatsRaw = vehicle.seats ?? vehicle.no_of_doors;
  const seats = typeof seatsRaw === 'string' ? Number(seatsRaw) : Number(seatsRaw ?? NaN);
  const councilName =
    typeof vehicle.council === 'string'
      ? vehicle.council
      : vehicle.council?.council_name || vehicle.council?.name || vehicle.council?.title || vehicle.council_name || '';

  return {
    id: String(vehicle.id),
    registrationNumber: vehicle.registration_number,
    make: derivedMake || (vehicle.vehicle_type ?? 'Unknown').toUpperCase(),
    model,
    council: councilName,
    type: vehicle.vehicle_type ?? vehicle.body_type ?? vehicle.vehicle_size ?? 'Unknown',
    seats: Number.isFinite(seats) ? seats : null,
    year: new Date().getFullYear(),
    mileage: Number.isFinite(mileage) ? mileage : 0,
    status: vehicle.deleted ? 'In Service' : 'Available',
    motExpiry: '',
    insuranceExpiry: '',
  };
};

export const getDvlaInfo = async (registrationNumber: DvlaRequest): Promise<DvlaVehicleData> => {
  try {
    const response = await apiClient.get<DvlaResponse>(
      '/api/vehicle/dvla/'+ registrationNumber.registration_number,
      { timeout: 10000 }
    );

    const apiData = response.data;
    console.log('API raw response:', apiData);

    if (
      apiData.success &&
      apiData.data &&
      apiData.data.dvla
    ) {
      return apiData.data.dvla;
    } else {
      throw new Error(apiData.message || 'Search failed');
    }
  } catch (error) {
    console.warn('API call failed:', error);
    handleFleetApiError(error, 'Search failed');
  }
};

export const createVehicle = async (payload: CreateVehicleRequest): Promise<Car> => {
  try {
    const response = await apiClient.post<CreateVehicleResponse>('/api/vehicle/create', payload);
    const apiData = response.data;
    console.log('Create vehicle API response:', apiData);

    if (apiData.success && apiData.data?.vehicle) {
      return mapVehicleToCar(apiData.data.vehicle);
    }

    throw new Error(apiData.message || 'Failed to create vehicle');
  } catch (error) {
    console.warn('Create vehicle API call failed:', error);
    handleFleetApiError(error, 'Failed to create vehicle');
  }
};

function normalizeCouncil(item: VehicleCouncilListResponse['data'][number], index: number): VehicleCouncil | null {
  if (typeof item === 'string') {
    const name = item.trim();
    if (!name) return null;
    return { id: name, name };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const name = (item.council_name || item.name || item.title || '').trim();
  if (!name) return null;

  return {
    id: String(item.id ?? name ?? index),
    name,
  };
}

function mapExpenseRecord(record: VehicleExpenseRecord): VehicleExpense {
  const totalAmount = Number(record.total_amount ?? record.cost ?? record.amount ?? 0);
  const paidAmount = Number(record.paid_amount ?? totalAmount);
  const expenseDate = record.date || record.expense_date || '';
  const paidDate = record.paid_date || expenseDate;

  return {
    id: String(record.id),
    vehicleId: String(record.vehicle_id ?? ''),
    vehicleRegistration: record.vehicle_registration || '-',
    title: record.title || record.type || 'Expense',
    type: record.type || 'Other',
    mileage: Number(record.mileage ?? 0),
    amount: totalAmount,
    paidAmount,
    paidDate,
    expenseDate,
    description: record.description || record.note || '',
  };
}

function toDateAndTimeParts(dateTime: string): { date: string; time: string } {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' };
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return { date: datePart, time: timePart };
}

export const getVehicleCouncils = async (): Promise<VehicleCouncil[]> => {
  try {
    const response = await apiClient.get<VehicleCouncilListResponse>('/api/vehicle/council/list');
    const apiData = response.data;

    if (!apiData.success || !Array.isArray(apiData.data)) {
      throw new Error(apiData.message || 'Failed to fetch councils');
    }

    return apiData.data
      .map((item, index) => normalizeCouncil(item, index))
      .filter((item): item is VehicleCouncil => Boolean(item));
  } catch (error) {
    handleFleetApiError(error, 'Failed to fetch councils');
  }
};

export const createVehicleCouncil = async (payload: VehicleCouncilCreateRequest): Promise<VehicleCouncil> => {
  const councilName = (payload.name || payload.council_name || '').trim();

  if (!councilName) {
    throw new Error('Council name is required');
  }

  try {
    const response = await apiClient.post<VehicleCouncilCreateResponse>('/api/vehicle/council/create', {
      name: councilName,
      council_name: councilName,
    });
    const apiData = response.data;

    if (!apiData.success) {
      throw new Error(apiData.message || 'Failed to create council');
    }

    const name = (apiData.data?.council_name || apiData.data?.name || councilName).trim();
    return {
      id: String(apiData.data?.id ?? name),
      name,
    };
  } catch (error) {
    handleFleetApiError(error, 'Failed to create council');
  }
};

export const deleteVehicleCouncil = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/vehicle/council/${id}/delete`);
  } catch (error) {
    handleFleetApiError(error, 'Failed to delete council');
  }
};

export const updateVehicleCouncil = async (id: string, payload: VehicleCouncilUpdateRequest): Promise<VehicleCouncil> => {
  const councilName = (payload.name || payload.council_name || '').trim();

  if (!councilName) {
    throw new Error('Council name is required');
  }

  try {
    const response = await apiClient.post<VehicleCouncilUpdateResponse>(`/api/vehicle/council/${id}/update`, {
      name: councilName,
      council_name: councilName,
    });
    const apiData = response.data;

    if (!apiData.success) {
      throw new Error(apiData.message || 'Failed to update council');
    }

    const name = (apiData.data?.council_name || apiData.data?.name || councilName).trim();
    return {
      id: String(apiData.data?.id ?? id),
      name,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const created = await createVehicleCouncil({ name: councilName });
      await deleteVehicleCouncil(id);
      return created;
    }

    handleFleetApiError(error, 'Failed to update council');
  }
};

export const getVehicleExpenses = async (): Promise<VehicleExpense[]> => {
  try {
    const response = await apiClient.get<VehicleExpenseListResponse>('/api/vehicle/expense/list');
    const apiData = response.data;
    if (!apiData.success || !Array.isArray(apiData.data)) {
      throw new Error(apiData.message || 'Failed to fetch vehicle expenses');
    }

    return apiData.data.map(mapExpenseRecord);
  } catch (error) {
    handleFleetApiError(error, 'Failed to fetch vehicle expenses');
  }
};

export const getVehicleExpensesByVehicleId = async (vehicleId: string): Promise<VehicleExpense[]> => {
  try {
    const response = await apiClient.get<VehicleExpenseListResponse>(`/api/vehicle/${vehicleId}/expenses`);
    const apiData = response.data;
    if (!apiData.success || !Array.isArray(apiData.data)) {
      throw new Error(apiData.message || 'Failed to fetch vehicle expenses');
    }

    return apiData.data.map(mapExpenseRecord);
  } catch (error) {
    handleFleetApiError(error, 'Failed to fetch vehicle expenses');
  }
};

export const createVehicleExpense = async (vehicleId: string, payload: VehicleExpenseCreateRequest): Promise<VehicleExpense> => {
  try {
    const response = await apiClient.post<{ success: boolean; message: string; data?: VehicleExpenseRecord }>(`/api/vehicle/${vehicleId}/expense/create`, {
      type: payload.type,
      mileage: Number(payload.mileage),
      date: payload.date,
      total_amount: Number(payload.total_amount),
      paid_amount: Number(payload.paid_amount),
      paid_date: payload.paid_date,
      description: payload.description,
    });
    const apiData = response.data;
    if (!apiData.success) {
      throw new Error(apiData.message || 'Failed to create expense');
    }

    return mapExpenseRecord(apiData.data || { ...payload, id: Date.now(), vehicle_id: vehicleId });
  } catch (error) {
    handleFleetApiError(error, 'Failed to create expense');
  }
};

export const updateVehicleExpense = async (expenseId: string, payload: VehicleExpenseUpdateRequest): Promise<VehicleExpense> => {
  try {
    const response = await apiClient.post<{ success: boolean; message: string; data?: VehicleExpenseRecord }>(`/api/vehicle/expense/${expenseId}/update`, {
      type: payload.type,
      mileage: payload.mileage ? Number(payload.mileage) : undefined,
      date: payload.date,
      total_amount: payload.total_amount ? Number(payload.total_amount) : undefined,
      paid_amount: payload.paid_amount ? Number(payload.paid_amount) : undefined,
      paid_date: payload.paid_date,
      description: payload.description,
    });
    const apiData = response.data;
    if (!apiData.success) {
      throw new Error(apiData.message || 'Failed to update expense');
    }

    return mapExpenseRecord(apiData.data || { ...payload, id: expenseId });
  } catch (error) {
    handleFleetApiError(error, 'Failed to update expense');
  }
};

export const searchAvailableVehicles = async (request: {
  pickupDateTime: string;
  dropoffDateTime: string;
  pickupLocation?: string;
  vehicleType?: string;
  council?: string;
}): Promise<Car[]> => {
  try {
    const pickup = toDateAndTimeParts(request.pickupDateTime);
    const dropoff = toDateAndTimeParts(request.dropoffDateTime);

    const payload: AvailableVehicleSearchRequest = {
      pickup_date: pickup.date,
      pickup_time: pickup.time,
      dropoff_date: dropoff.date,
      dropoff_time: dropoff.time,
      pickup_location: request.pickupLocation,
      vehicle_type: request.vehicleType,
      council: request.council,
    };

    const response = await apiClient.post<VehicleListResponse>('/api/vehicle/available', payload);
    const apiData = response.data;

    if (!apiData.success || !Array.isArray(apiData.data)) {
      throw new Error(apiData.message || 'Failed to fetch available vehicles');
    }

    return apiData.data.map(mapVehicleToCar);
  } catch (error) {
    handleFleetApiError(error, 'Failed to fetch available vehicles');
  }
};

export const fleetService = {
  getAll: async (): Promise<Car[]> => {
    try {
      const response = await apiClient.get<VehicleListResponse>('/api/vehicle/list');
      const apiData = response.data;

      if (!apiData.success) {
        throw new Error(apiData.message || 'Failed to fetch vehicles');
      }

      if (!Array.isArray(apiData.data)) {
        return [];
      }

      return apiData.data.map(mapVehicleToCar);
    } catch (error) {
      handleFleetApiError(error, 'Failed to fetch vehicles');
    }
  },
  getById: async (): Promise<Car | undefined> => undefined,
  getByRegistrationNumber: async (): Promise<Car | undefined> => undefined,
  create: async (payload: CreateVehicleRequest): Promise<Car> => createVehicle(payload),
  update: async (car: Car): Promise<Car> => {
    try {
      const response = await withFleetRetry(() =>
        apiClient.post<CreateVehicleResponse>(`/api/vehicle/update/${car.id}`, {
          registration_number: car.registrationNumber,
          council: car.council,
          model: car.model,
          vehicle_type: car.type,
          mileage: String(car.mileage),
          no_of_doors: car.seats != null ? String(car.seats) : undefined,
        })
      );

      const apiData = response.data;
      if (apiData.success && apiData.data?.vehicle) {
        return mapVehicleToCar(apiData.data.vehicle);
      }

      throw new Error(apiData.message || 'Failed to update vehicle');
    } catch (error) {
      handleFleetApiError(error, 'Failed to update vehicle');
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await withFleetRetry(() => apiClient.post(`/api/vehicle/delete/${id}`));
    } catch (error) {
      handleFleetApiError(error, 'Failed to delete vehicle');
    }
  },
  getCouncils: getVehicleCouncils,
  createCouncil: createVehicleCouncil,
  updateCouncil: updateVehicleCouncil,
  deleteCouncil: deleteVehicleCouncil,
  getExpenses: getVehicleExpenses,
  getExpensesByVehicleId: getVehicleExpensesByVehicleId,
  createExpense: createVehicleExpense,
  updateExpense: updateVehicleExpense,
  searchAvailableVehicles,
  getDvlaInfo,
  createVehicle,
};
