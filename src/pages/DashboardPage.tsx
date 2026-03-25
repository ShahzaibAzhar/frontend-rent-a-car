import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCars, selectAllCars } from '@/features/fleet/fleetSlice';
import { fetchBookings, selectActiveBookings, selectAllBookings } from '@/features/bookings/bookingSlice';
import { fetchMaintenance, selectUpcomingServices } from '@/features/maintenance/maintenanceSlice';
import { fetchJobs, selectTodayJobs } from '@/features/jobs/jobsSlice';
import { fetchFines, selectTotalUnpaidAmount } from '@/features/fines/finesSlice';
import { selectRole } from '@/features/auth/authSlice';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Car, CalendarCheck, Wrench, Truck, AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const cars = useAppSelector(selectAllCars);
  const bookings = useAppSelector(selectAllBookings);
  const activeBookings = useAppSelector(selectActiveBookings);
  const upcomingServices = useAppSelector(selectUpcomingServices);
  const todayJobs = useAppSelector(selectTodayJobs);
  const unpaidTotal = useAppSelector(selectTotalUnpaidAmount);
  const role = useAppSelector(selectRole);
  const navigate = useNavigate();
  const rentedCount = cars.filter(c => c.status === 'Rented').length;

  useEffect(() => {
    dispatch(fetchCars());
    dispatch(fetchBookings());
    dispatch(fetchMaintenance());
    dispatch(fetchJobs());
    dispatch(fetchFines());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Fleet" value={cars.length} icon={Car} description={`${rentedCount} currently rented`} />
        <StatCard title="Active Bookings" value={activeBookings.length} icon={CalendarCheck} description={`${bookings.length} total bookings`} />
        <StatCard title="Upcoming Services" value={upcomingServices.length} icon={Wrench} description="Next 7 days" />
        <StatCard title="Cars Rented" value={rentedCount} icon={BarChart3} description={`${Math.round((rentedCount / (cars.length || 1)) * 100)}% utilization`} />
        <StatCard title="Today's Jobs" value={todayJobs.length} icon={Truck} description="Pickups & deliveries" />
        <StatCard title="Unpaid Fines" value={`£${unpaidTotal}`} icon={AlertTriangle} description="Total outstanding" />
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
              <div key={b.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground">{b.startDate} — {b.endDate}</p>
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
                  <p className="text-xs text-muted-foreground">Car #{s.carId} · {s.scheduledDate}</p>
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
