import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { fetchCustomers, selectAllCustomers, selectCustomersLoading, createCustomerApi } from '@/features/customers/customerSlice';
import { fetchCars, selectAvailableCars, selectFleetLoading } from '@/features/fleet/fleetSlice';
import { fetchDrivers, selectAllDrivers, selectAdminLoading } from '@/features/admin/adminSlice';
import { createBooking } from '@/features/bookings/bookingSlice';
import { buildCouncilOptions, filterVehiclesByCriteria } from '@/features/bookings/vehicleFilterUtils';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDisplayDate } from '@/lib/utils';
import { getVehicleCouncils, searchAvailableVehicles } from '@/services/fleetService';
import { Car, CreateBookingRequest, CreateCustomerRequest, VehicleCouncil } from '@/types';

type Step = 1 | 2 | 3;
type CustomerMode = 'existing' | 'new';

const stepTitles: Record<Step, string> = {
  1: 'Select or Add Customer',
  2: 'Select Vehicle',
  3: 'Hire Details and Confirmation',
};

const titleOptions = [
  { label: 'Mr', value: 'mr' },
  { label: 'Mrs', value: 'mrs' },
  { label: 'Ms', value: 'ms' },
  { label: 'Miss', value: 'miss' },
  { label: 'Dr', value: 'dr' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const licenseTypeOptions = [
  { label: 'Learner', value: 'Learner' },
  { label: 'Provisional', value: 'Provisional' },
  { label: 'Full', value: 'Full' },
];

const paymentMethodOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
];

const bookingTypeOptions = [
  { label: 'Self', value: 'self' },
  { label: 'With Driver', value: 'driver' },
];

const emptyCustomerForm: CreateCustomerRequest = {
  title: 'mr',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: 'male',
  address: '',
  ni_number: '',
  profession: '',
  nationality: '',
  license_type: 'Learner',
  driver_license_number: '',
  license_issue_date: '',
  license_expiry_date: '',
  date_of_birth: '',
};

function toLocalDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(dateTime: string): string {
  return new Date(dateTime).toISOString();
}

function toMoneyString(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0.00';
  return parsed.toFixed(2);
}

export default function CreateBookingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const customers = useAppSelector(selectAllCustomers);
  const customersLoading = useAppSelector(selectCustomersLoading);
  const availableCars = useAppSelector(selectAvailableCars);
  const fleetLoading = useAppSelector(selectFleetLoading);
  const drivers = useAppSelector(selectAllDrivers);
  const adminLoading = useAppSelector(selectAdminLoading);

  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [customerMode, setCustomerMode] = useState<CustomerMode>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerForm, setCustomerForm] = useState<CreateCustomerRequest>(emptyCustomerForm);

  const [vehicleId, setVehicleId] = useState('');
  const [councilFilter, setCouncilFilter] = useState('all');
  const [seatFilter, setSeatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [councils, setCouncils] = useState<VehicleCouncil[]>([]);
  const [availableSearchResults, setAvailableSearchResults] = useState<Car[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [pickupDateTime, setPickupDateTime] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [dropoffDateTime, setDropoffDateTime] = useState('');
  const [dropoffEdited, setDropoffEdited] = useState(false);
  const [totalPayment, setTotalPayment] = useState('0');
  const [insuranceIncluded, setInsuranceIncluded] = useState(false);
  const [insurancePrice, setInsurancePrice] = useState('0');

  const [pickupLocation, setPickupLocation] = useState('new yard 12');
  const [dropoffLocation, setDropoffLocation] = useState('new yard 12');
  const [paidPayment, setPaidPayment] = useState('0.00');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingType, setBookingType] = useState('self');
  const [driverId, setDriverId] = useState('');
  const [driverEndDateTime, setDriverEndDateTime] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchCars());
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const loadCouncils = async () => {
      try {
        const values = await getVehicleCouncils();
        if (!cancelled) {
          setCouncils(values);
        }
      } catch {
        // Keep booking flow usable even if councils endpoint is temporarily unavailable.
      }
    };

    loadCouncils();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pickupDateTime || !durationHours || dropoffEdited) return;

    const hours = Number(durationHours);
    if (!Number.isFinite(hours) || hours <= 0) return;

    const pickup = new Date(pickupDateTime);
    if (Number.isNaN(pickup.getTime())) return;

    const dropoff = new Date(pickup.getTime() + (hours * 60 * 60 * 1000));
    setDropoffDateTime(toLocalDateTimeValue(dropoff));
  }, [pickupDateTime, durationHours, dropoffEdited]);

  useEffect(() => {
    if (pickupDateTime) return;
    const now = new Date();
    const in24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    setPickupDateTime(toLocalDateTimeValue(now));
    setDropoffDateTime(toLocalDateTimeValue(in24Hours));
  }, [pickupDateTime]);

  const customerOptions = useMemo(
    () => customers.map((customer) => ({
      label: `${customer.first_name} ${customer.last_name} (${customer.phone})`,
      value: String(customer.id),
    })),
    [customers],
  );

  const vehiclePool = availableSearchResults ?? availableCars;

  const vehicleOptions = useMemo(
    () => vehiclePool.map((car) => ({
      label: `${car.registrationNumber} - ${car.make} ${car.model}`,
      value: car.id,
    })),
    [vehiclePool],
  );

  const seatOptions = useMemo(
    () => {
      const values = Array.from(new Set(vehiclePool
        .map((car) => car.seats)
        .filter((seats): seats is number => typeof seats === 'number' && Number.isFinite(seats))));

      return [
        { label: 'All seats', value: 'all' },
        ...values.sort((a, b) => a - b).map((value) => ({ label: `${value} seats`, value: String(value) })),
      ];
    },
    [vehiclePool],
  );

  const typeOptions = useMemo(
    () => {
      const values = Array.from(new Set(vehiclePool
        .map((car) => (car.type || '').trim())
        .filter((type) => type.length > 0)));

      return [
        { label: 'All types', value: 'all' },
        ...values.sort((a, b) => a.localeCompare(b)).map((value) => ({ label: value, value })),
      ];
    },
    [vehiclePool],
  );

  const councilOptions = useMemo(
    () => buildCouncilOptions(councils, vehiclePool),
    [councils, vehiclePool],
  );

  const filteredVehicles = useMemo(
    () => filterVehiclesByCriteria(vehiclePool, { council: councilFilter, seat: seatFilter, type: typeFilter }),
    [vehiclePool, councilFilter, seatFilter, typeFilter],
  );

  useEffect(() => {
    if (!vehicleId) return;
    if (!filteredVehicles.some((car) => car.id === vehicleId)) {
      setVehicleId('');
    }
  }, [filteredVehicles, vehicleId]);

  const driverOptions = useMemo(
    () => drivers
      .filter((driver) => !driver.deleted)
      .map((driver) => ({
        label: `${driver.first_name} ${driver.last_name}`,
        value: String(driver.id),
      })),
    [drivers],
  );

  const selectedVehicleLabel = vehicleOptions.find((option) => option.value === vehicleId)?.label || 'None selected';
  const selectedCustomerLabel = customerOptions.find((option) => option.value === selectedCustomerId)?.label || 'None selected';

  const setCustomerField = (key: keyof CreateCustomerRequest) => (value: string) => {
    setCustomerForm((current) => ({ ...current, [key]: value }));
  };

  const validateStepOne = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (customerMode === 'existing') {
      if (!selectedCustomerId) nextErrors.selectedCustomerId = 'Please select a customer.';
    } else {
      const requiredFields: Array<keyof CreateCustomerRequest> = [
        'title',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'address',
        'ni_number',
        'nationality',
        'license_type',
        'driver_license_number',
        'license_issue_date',
        'license_expiry_date',
        'date_of_birth',
      ];

      requiredFields.forEach((field) => {
        if (!String(customerForm[field] ?? '').trim()) {
          nextErrors[field] = 'Required';
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepTwo = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!vehicleId) nextErrors.vehicleId = 'Please select a vehicle.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepThree = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!pickupDateTime) nextErrors.pickupDateTime = 'Pickup date and time is required.';
    if (!dropoffDateTime) nextErrors.dropoffDateTime = 'Dropoff date and time is required.';

    const duration = Number(durationHours);
    if (!durationHours || !Number.isFinite(duration) || duration <= 0) {
      nextErrors.durationHours = 'Duration must be greater than 0 hours.';
    }

    const total = Number(totalPayment);
    if (!Number.isFinite(total) || total <= 0) {
      nextErrors.totalPayment = 'Hire price must be greater than 0.';
    }

    if (!pickupLocation.trim()) nextErrors.pickupLocation = 'Pickup location is required.';
    if (!dropoffLocation.trim()) nextErrors.dropoffLocation = 'Dropoff location is required.';

    if (pickupDateTime && dropoffDateTime) {
      const pickup = new Date(pickupDateTime);
      const dropoff = new Date(dropoffDateTime);
      if (!Number.isNaN(pickup.getTime()) && !Number.isNaN(dropoff.getTime()) && dropoff <= pickup) {
        nextErrors.dropoffDateTime = 'Dropoff must be after pickup.';
      }
    }

    if (insuranceIncluded) {
      const insurance = Number(insurancePrice);
      if (!Number.isFinite(insurance) || insurance <= 0) {
        nextErrors.insurancePrice = 'Insurance price must be greater than 0.';
      }
    }

    if (bookingType !== 'self') {
      if (!driverId) nextErrors.driverId = 'Please select a driver.';
      if (!driverEndDateTime) nextErrors.driverEndDateTime = 'Driver end date and time is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    setStep((current) => Math.min(3, current + 1) as Step);
    setErrors({});
  };

  const handleBack = () => {
    setStep((current) => Math.max(1, current - 1) as Step);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStepThree()) return;

    setSaving(true);
    try {
      let customerId = selectedCustomerId;

      if (customerMode === 'new') {
        const createdCustomer = await dispatch(createCustomerApi(customerForm)).unwrap();
        customerId = String(createdCustomer.id);
      }

      const payload: CreateBookingRequest = {
        vehicle_id: vehicleId,
        customer_id: customerId,
        pickup_datetime: toIsoString(pickupDateTime),
        dropoff_datetime: toIsoString(dropoffDateTime),
        pickup_location: pickupLocation.trim(),
        dropoff_location: dropoffLocation.trim(),
        total_payment: toMoneyString(totalPayment),
        paid_payment: toMoneyString(paidPayment),
        payment_method: paymentMethod,
        booking_type: bookingType,
        driver_id: bookingType === 'self' ? null : driverId,
        driver_end_datetime: bookingType === 'self' ? null : toIsoString(driverEndDateTime),
        insurance_included: insuranceIncluded,
        insurance_price: insuranceIncluded ? toMoneyString(insurancePrice) : null,
        status: 'pending',
      };

      await dispatch(createBooking(payload)).unwrap();
      toast({ title: 'Booking created successfully' });
      navigate('/bookings');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create booking');
      toast({ title: 'Create booking failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSearchAvailability = async () => {
    if (!pickupDateTime || !dropoffDateTime) {
      toast({
        title: 'Pickup and dropoff are required',
        description: 'Set pickup and dropoff date/time to search availability.',
        variant: 'destructive',
      });
      return;
    }

    setAvailabilityLoading(true);
    try {
      const result = await searchAvailableVehicles({
        pickupDateTime,
        dropoffDateTime,
        pickupLocation,
        vehicleType: typeFilter === 'all' ? undefined : typeFilter,
        council: councilFilter === 'all' ? undefined : councilFilter,
      });
      setAvailableSearchResults(result);
      toast({ title: 'Availability refreshed', description: `${result.length} vehicle(s) returned from server.` });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch available vehicles');
      toast({ title: 'Availability search failed', description: message, variant: 'destructive' });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const clearAvailabilitySearch = () => {
    setAvailableSearchResults(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Booking" description="Complete all 3 steps to submit a booking.">
        <Button variant="outline" size="sm" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">Step {step} of 3</CardTitle>
            <span className="text-sm text-muted-foreground">{stepTitles[step]}</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </CardHeader>
      </Card>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Customer</CardTitle>
            <CardDescription>Select an existing customer or add a new one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={customerMode === 'existing' ? 'default' : 'outline'} onClick={() => setCustomerMode('existing')}>
                Select Existing
              </Button>
              <Button type="button" variant={customerMode === 'new' ? 'default' : 'outline'} onClick={() => setCustomerMode('new')}>
                Add New Customer
              </Button>
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-2">
                <FormField
                  label="Customer"
                  name="customer_id"
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  type="select"
                  options={customerOptions}
                  placeholder={customersLoading ? 'Loading customers...' : 'Select customer'}
                  error={errors.selectedCustomerId}
                  required
                />
                <p className="text-xs text-muted-foreground">Selected: {selectedCustomerLabel}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Title" name="title" value={customerForm.title} onChange={setCustomerField('title')} type="select" options={titleOptions} error={errors.title} required />
                <FormField label="Gender" name="gender" value={customerForm.gender} onChange={setCustomerField('gender')} type="select" options={genderOptions} error={errors.gender} required />
                <FormField label="First Name" name="first_name" value={customerForm.first_name} onChange={setCustomerField('first_name')} error={errors.first_name} required />
                <FormField label="Last Name" name="last_name" value={customerForm.last_name} onChange={setCustomerField('last_name')} error={errors.last_name} required />
                <FormField label="Email" name="email" value={customerForm.email} onChange={setCustomerField('email')} type="email" error={errors.email} required />
                <FormField label="Phone" name="phone" value={customerForm.phone} onChange={setCustomerField('phone')} type="tel" error={errors.phone} required />
                <FormField label="Profession" name="profession" value={customerForm.profession} onChange={setCustomerField('profession')} />
                <FormField label="Address" name="address" value={customerForm.address} onChange={setCustomerField('address')} className="sm:col-span-2" error={errors.address} required />
                <FormField label="NI Number" name="ni_number" value={customerForm.ni_number} onChange={setCustomerField('ni_number')} error={errors.ni_number} required />
                <FormField label="Nationality" name="nationality" value={customerForm.nationality} onChange={setCustomerField('nationality')} error={errors.nationality} required />
                <FormField label="License Type" name="license_type" value={customerForm.license_type} onChange={setCustomerField('license_type')} type="select" options={licenseTypeOptions} error={errors.license_type} required />
                <FormField label="Driver License Number" name="driver_license_number" value={customerForm.driver_license_number} onChange={setCustomerField('driver_license_number')} error={errors.driver_license_number} required />
                <FormField label="License Issue Date" name="license_issue_date" value={customerForm.license_issue_date} onChange={setCustomerField('license_issue_date')} type="date" error={errors.license_issue_date} required />
                <FormField label="License Expiry Date" name="license_expiry_date" value={customerForm.license_expiry_date} onChange={setCustomerField('license_expiry_date')} type="date" error={errors.license_expiry_date} required />
                <FormField label="Date of Birth" name="date_of_birth" value={customerForm.date_of_birth} onChange={setCustomerField('date_of_birth')} type="date" error={errors.date_of_birth} required />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Vehicle</CardTitle>
            <CardDescription>Use server-side availability search with council/type, then refine client-side and select a vehicle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Pickup Date and Time" name="search_pickup_datetime" value={pickupDateTime} onChange={setPickupDateTime} type="datetime-local" required />
              <FormField
                label="Dropoff Date and Time"
                name="search_dropoff_datetime"
                value={dropoffDateTime}
                onChange={(value) => {
                  setDropoffDateTime(value);
                  setDropoffEdited(true);
                }}
                type="datetime-local"
                required
              />
              <FormField label="Pickup Location" name="search_pickup_location" value={pickupLocation} onChange={setPickupLocation} />
              <div className="flex items-end gap-2">
                <Button type="button" onClick={handleSearchAvailability} disabled={availabilityLoading} className="w-full">
                  {availabilityLoading ? 'Searching...' : 'Search Available'}
                </Button>
                {availableSearchResults && (
                  <Button type="button" variant="outline" onClick={clearAvailabilitySearch}>
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Filter by Council" name="filter_council" value={councilFilter} onChange={setCouncilFilter} type="select" options={councilOptions} />
              <FormField label="Filter by Seats" name="filter_seats" value={seatFilter} onChange={setSeatFilter} type="select" options={seatOptions} />
              <FormField label="Filter by Type" name="filter_type" value={typeFilter} onChange={setTypeFilter} type="select" options={typeOptions} />
            </div>

            {availableSearchResults && (
              <p className="text-xs text-muted-foreground">
                Showing server availability results ({availableSearchResults.length} vehicles).
              </p>
            )}

            <div className="space-y-2">
              {fleetLoading && !availableSearchResults && <p className="text-sm text-muted-foreground">Loading vehicles...</p>}

              {!fleetLoading && filteredVehicles.length === 0 && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No vehicles match the selected filters.
                </p>
              )}

              {!fleetLoading && filteredVehicles.map((car) => {
                const isSelected = vehicleId === car.id;
                return (
                  <button
                    type="button"
                    key={car.id}
                    onClick={() => setVehicleId(car.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{car.registrationNumber} - {car.make} {car.model}</p>
                        <p className="text-xs text-muted-foreground">
                          Council: {car.council || 'Unknown'} | Type: {car.type || 'Unknown'} | Seats: {car.seats ?? 'Unknown'}
                        </p>
                      </div>
                      {isSelected && <span className="text-xs font-medium text-primary">Selected</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {errors.vehicleId && <p className="text-xs text-destructive">{errors.vehicleId}</p>}
            <p className="text-xs text-muted-foreground">Selected: {selectedVehicleLabel}</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Hire and Pricing</CardTitle>
            <CardDescription>Set core hire details, insurance and optional advanced API fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Pickup Date and Time" name="pickup_datetime" value={pickupDateTime} onChange={setPickupDateTime} type="datetime-local" error={errors.pickupDateTime} required />
              <FormField
                label="Duration (Hours)"
                name="duration_hours"
                value={durationHours}
                onChange={(value) => {
                  setDurationHours(value);
                  setDropoffEdited(false);
                }}
                type="number"
                error={errors.durationHours}
                required
              />
              <FormField
                label="Dropoff Date and Time"
                name="dropoff_datetime"
                value={dropoffDateTime}
                onChange={(value) => {
                  setDropoffDateTime(value);
                  setDropoffEdited(true);
                }}
                type="datetime-local"
                error={errors.dropoffDateTime}
                required
              />
              <FormField label="Hire Price" name="total_payment" value={totalPayment} onChange={setTotalPayment} type="number" error={errors.totalPayment} required />
              <FormField
                label="Insurance Included"
                name="insurance_included"
                value={insuranceIncluded ? 'yes' : 'no'}
                onChange={(value) => setInsuranceIncluded(value === 'yes')}
                type="select"
                options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]}
              />
              {insuranceIncluded && (
                <FormField label="Insurance Price" name="insurance_price" value={insurancePrice} onChange={setInsurancePrice} type="number" error={errors.insurancePrice} required />
              )}
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Advanced Fields</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvanced((current) => !current)}>
                  {showAdvanced ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showAdvanced && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Pickup Location" name="pickup_location" value={pickupLocation} onChange={setPickupLocation} error={errors.pickupLocation} required />
                  <FormField label="Dropoff Location" name="dropoff_location" value={dropoffLocation} onChange={setDropoffLocation} error={errors.dropoffLocation} required />
                  <FormField label="Paid Amount" name="paid_payment" value={paidPayment} onChange={setPaidPayment} type="number" />
                  <FormField label="Payment Method" name="payment_method" value={paymentMethod} onChange={setPaymentMethod} type="select" options={paymentMethodOptions} />
                  <FormField label="Booking Type" name="booking_type" value={bookingType} onChange={setBookingType} type="select" options={bookingTypeOptions} />
                  {bookingType !== 'self' && (
                    <>
                      <FormField label="Driver" name="driver_id" value={driverId} onChange={setDriverId} type="select" options={driverOptions} error={errors.driverId} placeholder={adminLoading ? 'Loading drivers...' : 'Select driver'} required />
                      <FormField label="Driver End Date and Time" name="driver_end_datetime" value={driverEndDateTime} onChange={setDriverEndDateTime} type="datetime-local" error={errors.driverEndDateTime} required />
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <p><span className="font-medium">Customer:</span> {customerMode === 'existing' ? selectedCustomerLabel : `${customerForm.first_name} ${customerForm.last_name}`.trim() || 'New customer'}</p>
              <p><span className="font-medium">Vehicle:</span> {selectedVehicleLabel}</p>
              <p><span className="font-medium">Pickup:</span> {formatDisplayDate(pickupDateTime, '-')}</p>
              <p><span className="font-medium">Dropoff:</span> {formatDisplayDate(dropoffDateTime, '-')}</p>
              <p><span className="font-medium">Total:</span> {toMoneyString(totalPayment)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={step === 1 ? () => navigate('/bookings') : handleBack} disabled={saving}>
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={handleNext} disabled={saving}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? 'Submitting...' : 'Create Booking'}
          </Button>
        )}
      </div>
    </div>
  );
}
