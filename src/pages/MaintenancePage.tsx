import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMaintenance, selectAllMaintenance, selectMaintenanceLoading, createMaintenanceJob, updateMaintenanceJob, deleteMaintenanceJob } from '@/features/maintenance/maintenanceSlice';
import { fetchCars, selectAllCars } from '@/features/fleet/fleetSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { MaintenanceJob, MaintenanceStatus } from '@/types';
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusOpts = [
  { label: 'Scheduled', value: 'Scheduled' }, { label: 'In Progress', value: 'In Progress' }, { label: 'Completed', value: 'Completed' },
];

const emptyJob = { carId: '', serviceType: '', description: '', scheduledDate: '', completedDate: null as string | null, cost: 0, status: 'Scheduled' as MaintenanceStatus };

export default function MaintenancePage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(selectAllMaintenance);
  const loading = useAppSelector(selectMaintenanceLoading);
  const cars = useAppSelector(selectAllCars);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceJob | null>(null);
  const [form, setForm] = useState(emptyJob);

  useEffect(() => { dispatch(fetchMaintenance()); dispatch(fetchCars()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setForm(emptyJob); setModalOpen(true); };
  const openEdit = (j: MaintenanceJob) => { setEditing(j); setForm(j); setModalOpen(true); };
  const openDelete = (j: MaintenanceJob) => { setEditing(j); setDeleteOpen(true); };

  const markComplete = async (j: MaintenanceJob) => {
    await dispatch(updateMaintenanceJob({ ...j, status: 'Completed', completedDate: new Date().toISOString().split('T')[0] }));
    toast({ title: 'Service marked as completed' });
  };

  const handleSave = async () => {
    if (editing) { await dispatch(updateMaintenanceJob({ ...editing, ...form })); toast({ title: 'Service updated' }); }
    else { await dispatch(createMaintenanceJob(form as Omit<MaintenanceJob, 'id'>)); toast({ title: 'Service created' }); }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteMaintenanceJob(editing.id)); toast({ title: 'Service deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: key === 'cost' ? Number(val) : val }));
  const carOptions = cars.map(c => ({ label: `${c.registrationNumber} — ${c.make} ${c.model}`, value: c.id }));

  const columns: Column<MaintenanceJob>[] = [
    { key: 'carId', header: 'Car', render: j => { const c = cars.find(x => x.id === j.carId); return c ? `${c.registrationNumber}` : j.carId; } },
    { key: 'serviceType', header: 'Type', sortable: true },
    { key: 'description', header: 'Description' },
    { key: 'scheduledDate', header: 'Scheduled', sortable: true },
    { key: 'cost', header: 'Cost', render: j => `£${j.cost}` },
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
      <PageHeader title="Maintenance & Repairs" description="Service schedule and history" actionLabel="Add Service" actionIcon={Plus} onAction={openCreate} />
      <DataTable columns={columns} data={jobs} loading={loading} searchKeys={['serviceType', 'description']} searchPlaceholder="Search services..." filterKey="status" filterOptions={statusOpts} />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Service' : 'Add Service'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Vehicle" name="car" value={form.carId} onChange={set('carId')} type="select" options={carOptions} required />
          <FormField label="Service Type" name="type" value={form.serviceType} onChange={set('serviceType')} required />
          <FormField label="Description" name="desc" value={form.description} onChange={set('description')} className="sm:col-span-2" />
          <FormField label="Scheduled Date" name="date" value={form.scheduledDate} onChange={set('scheduledDate')} type="date" required />
          <FormField label="Estimated Cost (£)" name="cost" value={form.cost} onChange={set('cost')} type="number" />
          <FormField label="Status" name="status" value={form.status} onChange={set('status')} type="select" options={statusOpts} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Service" description="Delete this service record?" onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
