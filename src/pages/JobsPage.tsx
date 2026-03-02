import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchJobs, selectAllJobs, selectJobsLoading, createJob, updateJob, deleteJob } from '@/features/jobs/jobsSlice';
import { fetchBookings, selectAllBookings } from '@/features/bookings/bookingSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { PickupDeliveryJob, JobStatus } from '@/types';
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusOpts = [
  { label: 'Pending', value: 'Pending' }, { label: 'In Progress', value: 'In Progress' }, { label: 'Completed', value: 'Completed' },
];
const typeOpts = [{ label: 'Pickup', value: 'Pickup' }, { label: 'Delivery', value: 'Delivery' }];

const emptyJob = { bookingId: '', driverName: '', type: 'Pickup' as PickupDeliveryJob['type'], scheduledTime: '', status: 'Pending' as JobStatus };

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(selectAllJobs);
  const loading = useAppSelector(selectJobsLoading);
  const bookings = useAppSelector(selectAllBookings);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<PickupDeliveryJob | null>(null);
  const [form, setForm] = useState(emptyJob);

  useEffect(() => { dispatch(fetchJobs()); dispatch(fetchBookings()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setForm(emptyJob); setModalOpen(true); };
  const openEdit = (j: PickupDeliveryJob) => { setEditing(j); setForm(j); setModalOpen(true); };
  const openDelete = (j: PickupDeliveryJob) => { setEditing(j); setDeleteOpen(true); };

  const markComplete = async (j: PickupDeliveryJob) => {
    await dispatch(updateJob({ ...j, status: 'Completed' }));
    toast({ title: 'Job completed' });
  };

  const handleSave = async () => {
    if (editing) { await dispatch(updateJob({ ...editing, ...form })); toast({ title: 'Job updated' }); }
    else { await dispatch(createJob(form as Omit<PickupDeliveryJob, 'id'>)); toast({ title: 'Job created' }); }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteJob(editing.id)); toast({ title: 'Job deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));
  const bookingOptions = bookings.map(b => ({ label: `#${b.id} — ${b.customerName}`, value: b.id }));

  const columns: Column<PickupDeliveryJob>[] = [
    { key: 'bookingId', header: 'Booking', render: j => { const b = bookings.find(x => x.id === j.bookingId); return b ? `#${b.id} ${b.customerName}` : j.bookingId; } },
    { key: 'driverName', header: 'Driver', sortable: true },
    { key: 'type', header: 'Type', render: j => <StatusBadge status={j.type} /> },
    { key: 'scheduledTime', header: 'Scheduled', sortable: true, render: j => new Date(j.scheduledTime).toLocaleString() },
    { key: 'status', header: 'Status', render: j => <StatusBadge status={j.status} /> },
    { key: 'actions', header: '', render: j => (
      <div className="flex gap-1">
        {j.status !== 'Completed' && <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={e => { e.stopPropagation(); markComplete(j); }}><CheckCircle className="h-3.5 w-3.5" /></Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEdit(j); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); openDelete(j); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Pickup & Delivery Jobs" description="Manage driver assignments" actionLabel="New Job" actionIcon={Plus} onAction={openCreate} />
      <DataTable columns={columns} data={jobs} loading={loading} searchKeys={['driverName']} searchPlaceholder="Search drivers..." filterKey="status" filterOptions={statusOpts} />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Job' : 'New Job'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Booking" name="booking" value={form.bookingId} onChange={set('bookingId')} type="select" options={bookingOptions} required />
          <FormField label="Driver Name" name="driver" value={form.driverName} onChange={set('driverName')} required />
          <FormField label="Type" name="type" value={form.type} onChange={set('type')} type="select" options={typeOpts} />
          <FormField label="Scheduled Time" name="time" value={form.scheduledTime} onChange={set('scheduledTime')} type="text" placeholder="YYYY-MM-DDTHH:mm" required />
          <FormField label="Status" name="status" value={form.status} onChange={set('status')} type="select" options={statusOpts} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Job" description="Delete this job?" onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
