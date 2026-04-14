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

export interface DvlaRequest {
  registration_number: string;
}

export interface DvlaVehicleData {
  id: number;
  registration_number: string;
  co2_emissions: number;
  engine_capacity: number;
  art_end_date: string;
  colour: string;
  fuel_type: string;
  make: string;
  marked_for_export: boolean;
  month_of_first_registration: string;
  month_of_first_dvla_registration?: string;
  mot_status: string;
  mot_expiry_date?: string;
  revenue_weight: number;
  tax_due_date: string;
  tax_status: string;
  type_approval: string;
  wheelplan: string;
  year_of_manufacture: number;
  euro_status: string;
  real_driving_emissions: string;
  date_of_last_v5c_issued: string;
  updated_at: string;
  created_at: string;
}

export interface DvlaResponse {
  success: boolean;
  message: string;
  data: {
    dvla: DvlaVehicleData;
  }
}

export interface VehicleListItem {
  id: number;
  company_id?: number;
  registration_number: string;
  vin_number?: string;
  total_buying_cost?: string;
  vehicle_type?: string;
  model?: string;
  vehicle_size?: string;
  transmission?: string;
  body_type?: string;
  steering?: string;
  interior_color?: string;
  tank_capacity?: number | string;
  no_of_doors?: number | string;
  bhp?: number | string;
  mileage?: number | string;
  mileage_limit?: number | string;
  interior_condition?: string;
  body_condition?: string;
  tyre_condition?: string;
  co2_emission?: number | string;
  ulez_compliant?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleListResponse {
  success: boolean;
  message: string;
  data: VehicleListItem[];
}

export interface CreateVehicleRequest {
  registration_number: string;
  vin_number: string;
  total_buying_cost: string;
  vehicle_type: string;
  model: string;
  vehicle_size: string;
  transmission: string;
  body_type: string;
  steering: string;
  interior_color: string;
  tank_capacity: string;
  no_of_doors: string;
  bhp: string;
  mileage: string;
  mileage_limit: string;
  interior_condition: string;
  body_condition: string;
  tyre_condition: string;
  co2_emission: string;
  ulez_compliant: 'true' | 'false';
}

export interface CreateVehicleResponse {
  success: boolean;
  message: string;
  data: {
    vehicle: VehicleListItem;
    dvla?: DvlaVehicleData;
  };
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

// ========== Admin – Staff & Drivers ==========
export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  deleted: boolean;
  company_id?: number;
  created_at?: string;
}

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  license_type: string;
  license_expiry: string;
  deleted: boolean;
  company_id?: number;
  created_at?: string;
}

export interface CreateStaffRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
}

export interface UpdateStaffRequest {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface CreateDriverRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  license_type: string;
  license_expiry: string;
  password: string;
}

export interface UpdateDriverRequest {
  first_name: string;
  last_name: string;
  phone: string;
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
