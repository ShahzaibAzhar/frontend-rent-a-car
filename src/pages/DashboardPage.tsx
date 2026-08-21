import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCars, selectAllCars } from '@/features/fleet/fleetSlice';
import { fetchBookings, selectActiveBookings, selectAllBookings } from '@/features/bookings/bookingSlice';
import { fetchMaintenance, selectUpcomingServices } from '@/features/maintenance/maintenanceSlice';
import { fetchJobs, selectTodayJobs } from '@/features/jobs/jobsSlice';
import { fetchFines, selectTotalUnpaidAmount } from '@/features/fines/finesSlice';
import { fetchCustomers, selectAllCustomers } from '@/features/customers/customerSlice';
import { selectRole } from '@/features/auth/authSlice';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Car, CalendarCheck, Wrench, Truck, AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDisplayDate } from '@/lib/utils';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const cars = useAppSelector(selectAllCars);
  const customers = useAppSelector(selectAllCustomers);
  const bookings = useAppSelector(selectAllBookings);
  const activeBookings = useAppSelector(selectActiveBookings);
  const upcomingServices = useAppSelector(selectUpcomingServices);
  const todayJobs = useAppSelector(selectTodayJobs);
  const unpaidTotal = useAppSelector(selectTotalUnpaidAmount);
  const role = useAppSelector(selectRole);
  const navigate = useNavigate();
  const rentedCount = cars.filter(c => c.status === 'Rented').length;
  const carById = new Map(cars.map((car) => [car.id, car]));
  const customerById = new Map(
    customers.map((customer) => [String(customer.id), `${customer.first_name} ${customer.last_name}`.trim()])
  );

  const getCustomerDisplayName = (customerId: string, bookingCustomerName: string) => {
    const nameFromCustomerList = customerById.get(customerId);
    if (nameFromCustomerList) return nameFromCustomerList;

    if (!/^customer\s*#?\s*\d+$/i.test(bookingCustomerName.trim())) {
      return bookingCustomerName;
    }

    return 'Unknown customer';
  };

  const getCarDisplayName = (assignedCarId: string) => {
    const car = carById.get(assignedCarId);
    if (!car) return `#${assignedCarId}`;

    const reg = car.registrationNumber || `#${assignedCarId}`;
    const makeModel = `${car.make || ''} ${car.model || ''}`.trim();
    return makeModel ? `${reg} · ${makeModel}` : reg;
  };

  useEffect(() => {
    dispatch(fetchCars());
    dispatch(fetchCustomers());
    dispatch(fetchBookings());
    dispatch(fetchMaintenance());
    dispatch(fetchJobs());
    dispatch(fetchFines());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Fleet" value={cars.length} icon={Car} description={`${rentedCount} currently rented`} onClick={() => navigate('/fleet')} />
        <StatCard title="Active Bookings" value={activeBookings.length} icon={CalendarCheck} description={`${bookings.length} total bookings`} onClick={() => navigate('/bookings')} />
        <StatCard title="Upcoming Services" value={upcomingServices.length} icon={Wrench} description="Next 7 days" onClick={() => navigate('/maintenance')} />
        <StatCard title="Cars Rented" value={rentedCount} icon={BarChart3} description={`${Math.round((rentedCount / (cars.length || 1)) * 100)}% utilization`} onClick={() => navigate('/fleet')} />
        <StatCard title="Today's Jobs" value={todayJobs.length} icon={Truck} description="Pickups & deliveries" onClick={() => navigate('/jobs')} />
        <StatCard title="Unpaid Fines" value={`£${unpaidTotal}`} icon={AlertTriangle} description="Total outstanding" onClick={() => navigate('/fines')} />
      </div>

      {role === 'ADMIN' && (
        <div
          className="flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-5 transition-colors hover:bg-muted/50"
          onClick={() => navigate('/admin')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Admin Panel</p>
            <p className="text-xs text-muted-foreground">Manage office staff and drivers</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-base font-semibold text-card-foreground">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map(b => (
              <div
                key={b.id}
                className="flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/40"
                onClick={() => navigate(`/bookings/${b.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">{getCustomerDisplayName(b.customerId, b.customerName)}</p>
                  <p className="text-xs text-muted-foreground">
                    Car: {getCarDisplayName(b.assignedCarId)}
                  </p>
                  <p className="text-xs text-muted-foreground">Start: {formatDisplayDate(b.startDate)}</p>
                  <p className="text-xs text-muted-foreground">End: {formatDisplayDate(b.endDate)}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-base font-semibold text-card-foreground">Upcoming Services</h3>
          <div className="space-y-3">
            {upcomingServices.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{s.serviceType}</p>
                  <p className="text-xs text-muted-foreground">Car #{s.carId} · {formatDisplayDate(s.scheduledDate)}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {upcomingServices.length === 0 && <p className="text-sm text-muted-foreground">No upcoming services</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
