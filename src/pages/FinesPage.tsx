import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchFines, selectAllFines, selectFinesLoading, selectTotalUnpaidAmount, createFine, updateFine, deleteFine } from '@/features/fines/finesSlice';
import { fetchCars, selectAllCars } from '@/features/fleet/fleetSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Fine, FineStatus } from '@/types';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusOpts = [
  { label: 'Unpaid', value: 'Unpaid' }, { label: 'Paid', value: 'Paid' }, { label: 'Disputed', value: 'Disputed' },
];

const emptyFine = { carId: '', issueDate: '', dueDate: '', amount: 0, status: 'Unpaid' as FineStatus };

export default function FinesPage() {
  const dispatch = useAppDispatch();
  const fines = useAppSelector(selectAllFines);
  const loading = useAppSelector(selectFinesLoading);
  const cars = useAppSelector(selectAllCars);
  const unpaidTotal = useAppSelector(selectTotalUnpaidAmount);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Fine | null>(null);
  const [form, setForm] = useState(emptyFine);

  useEffect(() => { dispatch(fetchFines()); dispatch(fetchCars()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setForm(emptyFine); setModalOpen(true); };
  const openEdit = (f: Fine) => { setEditing(f); setForm(f); setModalOpen(true); };
  const openDelete = (f: Fine) => { setEditing(f); setDeleteOpen(true); };

  const markPaid = async (f: Fine) => { await dispatch(updateFine({ ...f, status: 'Paid' })); toast({ title: 'Fine marked as paid' }); };

  const handleSave = async () => {
    if (editing) { await dispatch(updateFine({ ...editing, ...form })); toast({ title: 'Fine updated' }); }
    else { await dispatch(createFine(form as Omit<Fine, 'id'>)); toast({ title: 'Fine logged' }); }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteFine(editing.id)); toast({ title: 'Fine deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: key === 'amount' ? Number(val) : val }));
  const carOptions = cars.map(c => ({ label: `${c.registrationNumber} — ${c.make} ${c.model}`, value: c.id }));

  const columns: Column<Fine>[] = [
    { key: 'carId', header: 'Vehicle', render: f => { const c = cars.find(x => x.id === f.carId); return c ? c.registrationNumber : f.carId; } },
    { key: 'issueDate', header: 'Issued', sortable: true },
    { key: 'dueDate', header: 'Due', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: f => `£${f.amount}` },
    { key: 'status', header: 'Status', render: f => <StatusBadge status={f.status} /> },
    { key: 'actions', header: '', render: f => (
      <div className="flex gap-1">
        {f.status === 'Unpaid' && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={e => { e.stopPropagation(); markPaid(f); }}>Mark Paid</Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEdit(f); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); openDelete(f); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="PCNs / Fines" description="Track and manage fines" actionLabel="Log Fine" actionIcon={Plus} onAction={openCreate} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Unpaid" value={`£${unpaidTotal}`} icon={AlertTriangle} />
        <StatCard title="Total Fines" value={fines.length} icon={AlertTriangle} />
        <StatCard title="Unpaid Count" value={fines.filter(f => f.status === 'Unpaid').length} icon={AlertTriangle} />
      </div>
      <DataTable columns={columns} data={fines} loading={loading} searchKeys={['carId']} searchPlaceholder="Search by car..." filterKey="status" filterOptions={statusOpts} />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Fine' : 'Log Fine'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Vehicle" name="car" value={form.carId} onChange={set('carId')} type="select" options={carOptions} required />
          <FormField label="Amount (£)" name="amount" value={form.amount} onChange={set('amount')} type="number" required />
          <FormField label="Issue Date" name="issued" value={form.issueDate} onChange={set('issueDate')} type="date" required />
          <FormField label="Due Date" name="due" value={form.dueDate} onChange={set('dueDate')} type="date" required />
          <FormField label="Status" name="status" value={form.status} onChange={set('status')} type="select" options={statusOpts} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Log Fine'}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Fine" description="Delete this fine record?" onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
