import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchBookings, selectAllBookings, selectBookingsLoading, createBooking, updateBooking, deleteBooking } from '@/features/bookings/bookingSlice';
import { fetchCars, selectAvailableCars } from '@/features/fleet/fleetSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Booking, BookingStatus } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusOpts = [
  { label: 'Upcoming', value: 'Upcoming' }, { label: 'Active', value: 'Active' },
  { label: 'Completed', value: 'Completed' }, { label: 'Cancelled', value: 'Cancelled' },
];

const emptyBooking = { customerName: '', customerPhone: '', startDate: '', endDate: '', assignedCarId: '', totalPrice: 0, status: 'Upcoming' as BookingStatus };

export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const bookings = useAppSelector(selectAllBookings);
  const loading = useAppSelector(selectBookingsLoading);
  const availableCars = useAppSelector(selectAvailableCars);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState(emptyBooking);

  useEffect(() => { dispatch(fetchBookings()); dispatch(fetchCars()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setForm(emptyBooking); setModalOpen(true); };
  const openEdit = (b: Booking) => { setEditing(b); setForm(b); setModalOpen(true); };
  const openDelete = (b: Booking) => { setEditing(b); setDeleteOpen(true); };

  const handleSave = async () => {
    if (editing) { await dispatch(updateBooking({ ...editing, ...form })); toast({ title: 'Booking updated' }); }
    else { await dispatch(createBooking(form)); toast({ title: 'Booking created' }); }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteBooking(editing.id)); toast({ title: 'Booking deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: key === 'totalPrice' ? Number(val) : val }));

  const carOptions = availableCars.map(c => ({ label: `${c.registrationNumber} — ${c.make} ${c.model}`, value: c.id }));

  const columns: Column<Booking>[] = [
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'customerPhone', header: 'Phone' },
    { key: 'startDate', header: 'Start', sortable: true },
    { key: 'endDate', header: 'End', sortable: true },
    { key: 'assignedCarId', header: 'Car ID' },
    { key: 'totalPrice', header: 'Price', sortable: true, render: b => `£${b.totalPrice}` },
    { key: 'status', header: 'Status', render: b => <StatusBadge status={b.status} /> },
    { key: 'actions', header: '', render: b => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEdit(b); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); openDelete(b); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage customer bookings" actionLabel="New Booking" actionIcon={Plus} onAction={openCreate} />
      <DataTable columns={columns} data={bookings} loading={loading} searchKeys={['customerName', 'customerPhone']} searchPlaceholder="Search customers..." filterKey="status" filterOptions={statusOpts} />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Booking' : 'New Booking'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Customer Name" name="name" value={form.customerName} onChange={set('customerName')} required />
          <FormField label="Phone" name="phone" value={form.customerPhone} onChange={set('customerPhone')} type="tel" />
          <FormField label="Start Date" name="start" value={form.startDate} onChange={set('startDate')} type="date" required />
          <FormField label="End Date" name="end" value={form.endDate} onChange={set('endDate')} type="date" required />
          <FormField label="Assign Car" name="car" value={form.assignedCarId} onChange={set('assignedCarId')} type="select" options={carOptions} />
          <FormField label="Total Price (£)" name="price" value={form.totalPrice} onChange={set('totalPrice')} type="number" />
          <FormField label="Status" name="status" value={form.status} onChange={set('status')} type="select" options={statusOpts} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Booking" description={`Delete booking for ${editing?.customerName}?`} onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
