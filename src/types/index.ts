// ========== Car / Fleet ==========
export type CarStatus = 'Available' | 'Rented' | 'In Service' | 'Reserved';

export interface Car {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  council?: string;
  type?: string;
  seats?: number | null;
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
  council_id?: number | string;
  council_name?: string;
  council?:
    | string
    | {
      id?: number | string;
      council_name?: string;
      name?: string;
      title?: string;
    };
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
  seats?: number | string;
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
  council: string;
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

export interface VehicleCouncil {
  id: string;
  name: string;
}

export interface VehicleCouncilListResponse {
  success: boolean;
  message: string;
  data: Array<
    | string
    | {
      id?: number | string;
      council_name?: string;
      name?: string;
      title?: string;
    }
  >;
}

export interface VehicleCouncilCreateRequest {
  council_name?: string;
  name?: string;
}

export interface VehicleCouncilCreateResponse {
  success: boolean;
  message: string;
  data?: {
    id?: number | string;
    council_name?: string;
    name?: string;
  };
}

export interface VehicleCouncilUpdateRequest {
  council_name?: string;
  name?: string;
}

export interface VehicleCouncilUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    id?: number | string;
    council_name?: string;
    name?: string;
  };
}

export interface VehicleExpenseRecord {
  id: number | string;
  vehicle_id?: number | string;
  vehicle_registration?: string;
  title?: string;
  type?: string;
  mileage?: number | string;
  cost?: number | string;
  amount?: number | string;
  total_amount?: number | string;
  paid_amount?: number | string;
  paid_date?: string;
  date?: string;
  expense_date?: string;
  description?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleExpense {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;
  title: string;
  type: string;
  mileage: number;
  amount: number;
  paidAmount: number;
  paidDate: string;
  expenseDate: string;
  description: string;
}

export interface VehicleExpenseCreateRequest {
  type: string;
  mileage: string;
  total_amount: string;
  paid_amount: string;
  date: string;
  paid_date: string;
  description?: string;
}

export interface VehicleExpenseUpdateRequest {
  type?: string;
  mileage?: string;
  total_amount?: string;
  paid_amount?: string;
  date?: string;
  paid_date?: string;
  description?: string;
}

export interface VehicleExpenseListResponse {
  success: boolean;
  message: string;
  data: VehicleExpenseRecord[];
}

export interface AvailableVehicleSearchRequest {
  pickup_date: string;
  pickup_time: string;
  dropoff_date: string;
  dropoff_time: string;
  pickup_location?: string;
  vehicle_type?: string;
  council?: string;
}

// ========== Customers ==========
export interface Customer {
  id: number;
  company_id?: number;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  ni_number: string;
  profession: string;
  nationality: string;
  license_type: string;
  driver_license_number: string;
  license_issue_date: string;
  license_expiry_date: string;
  date_of_birth: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerListResponse {
  success: boolean;
  message: string;
  data: Customer[];
}

export interface CreateCustomerRequest {
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  password?: string;
  ni_number: string;
  profession: string;
  nationality: string;
  license_type: string;
  driver_license_number: string;
  license_issue_date: string;
  license_expiry_date: string;
  date_of_birth: string;
}

export interface CreateCustomerResponse {
  success: boolean;
  message: string;
  data: Customer;
}

// ========== Booking ==========
export const BOOKING_STATUS_ORDER = [
  'pending',
  'pending documents with insurance',
  'pending documents without insurance',
  'pending document review',
  'documents approved',
  'pending agreement signing',
  'pending handover',
  'waiting customer confirmation',
  'done',
] as const;

export type BookingStatus = (typeof BOOKING_STATUS_ORDER)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  'pending': 'Pending',
  'pending documents with insurance': 'Pending Documents (With Insurance)',
  'pending documents without insurance': 'Pending Documents (Without Insurance)',
  'pending document review': 'Pending Document Review',
  'documents approved': 'Documents Approved',
  'pending agreement signing': 'Pending Agreement Signing',
  'pending handover': 'Pending Handover',
  'waiting customer confirmation': 'Waiting Customer Confirmation',
  'done': 'Done',
};

export interface BookingApiRecord {
  id: number;
  status?: string;
  customer_document_status?: string | null;
  agreement_signing_status?: string | null;
  agreement_signed_at?: string | null;
  vehicle_id: string | number;
  customer_id: string | number;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location: string;
  dropoff_location: string;
  total_payment: string;
  paid_payment: string;
  payment_method: string;
  booking_type: string;
  driver_id: string | null;
  driver_end_datetime: string | null;
  insurance_included?: boolean;
  insurance_price: string | null;
  payment_status?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  booking_agreement?: BookingFileRecord[];
  customer_signature?: BookingFileRecord[];
  customer_insurance_documents?: BookingFileRecord[];
  vehicle_pickup_pictures?: BookingFileRecord[];
  vehicle_dropoff_pictures?: BookingFileRecord[];
  created_at?: string;
  updated_at?: string;
}

export interface BookingFileRecord {
  id: number;
  file_name?: string;
  file_path?: string;
  file_type?: string;
  mime_type?: string;
  created_at?: string;
}

export interface BookingDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType: string;
  uploadedAt: string;
}

export interface BookingListResponse {
  success: boolean;
  message: string;
  data: BookingApiRecord[];
}

export interface CreateBookingRequest {
  vehicle_id: string;
  customer_id: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location: string;
  dropoff_location: string;
  total_payment: string;
  paid_payment: string;
  payment_method: string;
  booking_type: string;
  driver_id: string | null;
  driver_end_datetime: string | null;
  insurance_included: boolean;
  insurance_price: string | null;
  status?: BookingStatus;
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: BookingApiRecord;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  pickupDateTime: string;
  dropoffDateTime: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleId: string;
  assignedCarId: string;
  totalPrice: number;
  paidPrice: number;
  paymentMethod: string;
  bookingType: string;
  driverId: string | null;
  driverEndDateTime: string | null;
  insuranceIncluded: boolean;
  insurancePrice: number;
  paymentStatus?: string;
  status: BookingStatus;
  customerDocumentStatus?: string | null;
  agreementSigningStatus?: string | null;
  agreementSignedAt?: string | null;
  bookingAgreement: BookingDocument[];
  customerSignature: BookingDocument[];
  customerInsuranceDocuments: BookingDocument[];
  vehiclePickupPictures: BookingDocument[];
  vehicleDropoffPictures: BookingDocument[];
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

export interface FineStatusHistoryItem {
  id: string;
  status: string;
  updatedByEmail?: string;
  updatedByRole?: string;
  note?: string;
  createdAt?: string;
}

export interface FineCustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface FineBookingSummary {
  id: string;
  pickupDateTime?: string;
  dropoffDateTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  bookingType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
}

export interface Fine {
  id: string;
  carId?: string;
  bookingId?: string;
  customerId?: string;
  vehicleId?: string;
  pcnRefNo?: string;
  vehicleRegistration: string;
  vehicleMake?: string;
  vehicleModel?: string;
  reasonOfCharge?: string;
  location?: string;
  datetimeOfEvent?: string;
  pcnPicture?: string;
  paidBy?: string | null;
  paidDateTime?: string | null;
  customer?: FineCustomerSummary | null;
  booking?: FineBookingSummary | null;
  statusHistory: FineStatusHistoryItem[];
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
