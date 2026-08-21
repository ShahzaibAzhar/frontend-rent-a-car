import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchFineById, fetchFines, selectAllFines, selectFinesLoading } from '@/features/fines/finesSlice';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fine } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';

function formatCustomerName(fine: Fine): string {
  if (!fine.customer) return '-';
  const fullName = `${fine.customer.firstName} ${fine.customer.lastName}`.trim();
  return fullName || '-';
}

function formatBookingLabel(fine: Fine): string {
  if (!fine.booking?.id) return '-';
  return `Booking #${fine.booking.id}`;
}

function renderDetailField(label: string, value: string) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '-'}</p>
    </div>
  );
}

function renderStatusTimeline(fine: Fine) {
  if (fine.statusHistory.length === 0) {
    return <p className="text-sm text-muted-foreground">No status history available.</p>;
  }

  return (
    <div className="space-y-0">
      {fine.statusHistory.map((item, index) => {
        const isLast = index === fine.statusHistory.length - 1;

        return (
          <div key={item.id} className="grid grid-cols-[20px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full bg-primary" />
              {!isLast && <span className="mt-1 h-full min-h-8 w-px bg-border" />}
            </div>
            <div className="pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-sm text-muted-foreground">{formatDisplayDate(item.createdAt, '-')}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {[item.updatedByEmail, item.updatedByRole].filter(Boolean).join(' - ') || '-'}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.note || 'No note provided.'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FineDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fines = useAppSelector(selectAllFines);
  const loading = useAppSelector(selectFinesLoading);

  useEffect(() => {
    if (fines.length === 0) {
      dispatch(fetchFines());
    }
  }, [dispatch, fines.length]);

  useEffect(() => {
    if (id) {
      dispatch(fetchFineById(id));
    }
  }, [dispatch, id]);

  const fine = useMemo(
    () => fines.find((item) => item.id === id) || null,
    [fines, id],
  );

  if (!id) {
    return <div className="text-sm text-muted-foreground">PCN not found.</div>;
  }

  if (!fine && loading) {
    return <div className="text-sm text-muted-foreground">Loading PCN details...</div>;
  }

  if (!fine) {
    return <div className="text-sm text-muted-foreground">PCN not found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`PCN ${fine.pcnRefNo || fine.id}`} description={`${fine.vehicleRegistration}${fine.vehicleMake || fine.vehicleModel ? ` - ${[fine.vehicleMake, fine.vehicleModel].filter(Boolean).join(' ')}` : ''}`}>
        <Button variant="outline" size="sm" onClick={() => navigate('/fines')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to PCNs
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">PCN Details</CardTitle>
            <CardDescription>{fine.location || '-'}</CardDescription>
          </div>
          <StatusBadge status={fine.status} />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {renderDetailField('Amount', `£${fine.amount}`)}
            {renderDetailField('Event Date', formatDisplayDate(fine.datetimeOfEvent, '-'))}
            {renderDetailField('Issue Date', formatDisplayDate(fine.issueDate, '-'))}
            {renderDetailField('Due Date', formatDisplayDate(fine.dueDate, '-'))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-semibold">Fine Details</h3>
              <div className="space-y-3 text-sm">
                {renderDetailField('Reason', fine.reasonOfCharge || '-')}
                {renderDetailField('Location', fine.location || '-')}
                {renderDetailField('Paid By', fine.paidBy || '-')}
                {renderDetailField('Paid At', formatDisplayDate(fine.paidDateTime, '-'))}
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-semibold">Customer</h3>
              <div className="space-y-3 text-sm">
                {renderDetailField('Name', formatCustomerName(fine))}
                {renderDetailField('Phone', fine.customer?.phone || '-')}
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-semibold">Booking</h3>
              <div className="space-y-3 text-sm">
                {renderDetailField('Booking', formatBookingLabel(fine))}
                {renderDetailField('Type', fine.booking?.bookingType || '-')}
                {renderDetailField('Payment', [fine.booking?.paymentMethod, fine.booking?.paymentStatus].filter(Boolean).join(' - ') || '-')}
                {renderDetailField('Status', fine.booking?.status || '-')}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-semibold">Pickup</h3>
              <div className="space-y-3 text-sm">
                {renderDetailField('Date & Time', formatDisplayDate(fine.booking?.pickupDateTime, '-'))}
                {renderDetailField('Location', fine.booking?.pickupLocation || '-')}
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-semibold">Dropoff</h3>
              <div className="space-y-3 text-sm">
                {renderDetailField('Date & Time', formatDisplayDate(fine.booking?.dropoffDateTime, '-'))}
                {renderDetailField('Location', fine.booking?.dropoffLocation || '-')}
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4">
            <h3 className="mb-4 text-sm font-semibold">Status Timeline</h3>
            {renderStatusTimeline(fine)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}