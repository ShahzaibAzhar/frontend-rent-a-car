import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  deleteBooking,
  fetchBookings,
  selectAllBookings,
  selectBookingsLoading,
} from '@/features/bookings/bookingSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_ORDER, Booking } from '@/types';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/utils';

const statusOpts = BOOKING_STATUS_ORDER.map((status) => ({
  label: BOOKING_STATUS_LABELS[status],
  value: status,
}));

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: unknown; error?: unknown };
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;
    if (typeof maybeError.error === 'string' && maybeError.error.trim()) return maybeError.error;
  }

  if (typeof error === 'string' && error.trim()) return error;
  return 'Unexpected error';
}

export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const bookings = useAppSelector(selectAllBookings);
  const loading = useAppSelector(selectBookingsLoading);
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);

  useEffect(() => { dispatch(fetchBookings()); }, [dispatch]);

  const openCreate = () => navigate('/bookings/new');
  const openView = (booking: Booking) => navigate(`/bookings/${booking.id}`);
  const openDelete = (b: Booking) => { setEditing(b); setDeleteOpen(true); };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteBooking(editing.id)); toast({ title: 'Booking deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const columns: Column<Booking>[] = [
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'customerPhone', header: 'Phone' },
    { key: 'startDate', header: 'Start', sortable: true, render: b => formatDisplayDate(b.startDate) },
    { key: 'endDate', header: 'End', sortable: true, render: b => formatDisplayDate(b.endDate) },
    { key: 'assignedCarId', header: 'Car ID' },
    { key: 'totalPrice', header: 'Price', sortable: true, render: b => `£${b.totalPrice}` },
    { key: 'status', header: 'Status', render: b => <StatusBadge status={b.status} /> },
    { key: 'actions', header: '', render: b => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openView(b); }}><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); openDelete(b); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage customer bookings" actionLabel="New Booking" actionIcon={Plus} onAction={openCreate} />
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        searchKeys={['customerName', 'customerPhone']}
        searchPlaceholder="Search customers..."
        filterKey="status"
        filterOptions={statusOpts}
        onRowClick={openView}
      />

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Booking" description={`Delete booking for ${editing?.customerName}?`} onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
