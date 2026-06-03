import axios from 'axios';
import {
  Car,
  CreateVehicleRequest,
  CreateVehicleResponse,
  DvlaRequest,
  DvlaResponse,
  DvlaVehicleData,
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

export const mapVehicleToCar = (vehicle: VehicleListItem): Car => {
  const model = vehicle.model ?? '';
  const derivedMake = model.trim().split(' ')[0];
  const mileage = typeof vehicle.mileage === 'string' ? Number(vehicle.mileage) : Number(vehicle.mileage ?? 0);
  const seatsRaw = vehicle.seats ?? vehicle.no_of_doors;
  const seats = typeof seatsRaw === 'string' ? Number(seatsRaw) : Number(seatsRaw ?? NaN);

  return {
    id: String(vehicle.id),
    registrationNumber: vehicle.registration_number,
    make: derivedMake || (vehicle.vehicle_type ?? 'Unknown').toUpperCase(),
    model,
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
  update: async (car: Car): Promise<Car> => car,
  delete: async (): Promise<void> => undefined,
  getDvlaInfo,
  createVehicle,
};
