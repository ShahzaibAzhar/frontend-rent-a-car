// ========== Car / Fleet ==========
export type CarStatus = 'Available' | 'Rented' | 'In Service' | 'Reserved';

export interface Car {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  status: CarStatus;
  motExpiry: string;
  insuranceExpiry: string;
}

// ========== Booking ==========
export type BookingStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  assignedCarId: string;
  totalPrice: number;
  status: BookingStatus;
}

// ========== Maintenance ==========
export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface MaintenanceJob {
  id: string;
  carId: string;
  serviceType: string;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  cost: number;
  status: MaintenanceStatus;
}

// ========== Pickup / Delivery Jobs ==========
export type JobType = 'Pickup' | 'Delivery';
export type JobStatus = 'Pending' | 'In Progress' | 'Completed';

export interface PickupDeliveryJob {
  id: string;
  bookingId: string;
  driverName: string;
  type: JobType;
  scheduledTime: string;
  status: JobStatus;
}

// ========== Documents ==========
export type DocumentType = 'Insurance' | 'MOT' | 'V5' | 'Service Record';

export interface CarDocument {
  id: string;
  carId: string;
  type: DocumentType;
  fileName: string;
  uploadDate: string;
  expiryDate: string | null;
}

// ========== Fines ==========
export type FineStatus = 'Unpaid' | 'Paid' | 'Disputed';

export interface Fine {
  id: string;
  carId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: FineStatus;
}

// ========== User / Auth ==========
export type UserRole = 'Admin' | 'Staff';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      accessToken: string;
      email: string;
      phone: string;
      role: string;
      linked_id: number;
      company_id: number;
      deleted: boolean;
    };
  };
}

// ========== Generic slice state ==========
export interface SliceState<T> {
  items: T[];
  selectedItem: T | null;
  loading: boolean;
  error: string | null;
}
