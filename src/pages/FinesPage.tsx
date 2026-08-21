import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchFines, selectAllFines, selectFinesLoading, selectTotalUnpaidAmount, createFine, updateFine } from '@/features/fines/finesSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Fine, FineStatus } from '@/types';
import { Plus, Pencil, AlertTriangle, Eye } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorMessage';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/utils';

const statusOpts = [
  { label: 'Unpaid', value: 'Unpaid' }, { label: 'Paid', value: 'Paid' }, { label: 'Disputed', value: 'Disputed' },
];

const emptyFine: Omit<Fine, 'id'> = {
  carId: '',
  bookingId: '',
  customerId: '',
  vehicleId: '',
  pcnRefNo: '',
  vehicleRegistration: '',
  vehicleMake: '',
  vehicleModel: '',
  reasonOfCharge: '',
  location: '',
  datetimeOfEvent: '',
  pcnPicture: '',
  paidBy: null,
  paidDateTime: null,
  customer: null,
  booking: null,
  statusHistory: [],
  issueDate: '',
  dueDate: '',
  amount: 0,
  status: 'Unpaid' as FineStatus,
};

export default function FinesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fines = useAppSelector(selectAllFines);
  const loading = useAppSelector(selectFinesLoading);
  const unpaidTotal = useAppSelector(selectTotalUnpaidAmount);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Fine | null>(null);
  const [form, setForm] = useState(emptyFine);

  useEffect(() => { dispatch(fetchFines()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setForm(emptyFine); setModalOpen(true); };
  const openEdit = (f: Fine) => { setEditing(f); setForm({ ...emptyFine, ...f }); setModalOpen(true); };
  const openView = (fine: Fine) => navigate(`/fines/${fine.id}`);

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast({ title: label });
    } catch (error) {
      toast({
        title: `${label} failed`,
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const markPaid = async (f: Fine) => {
    await runAction('PCN marked as paid', async () => {
      await dispatch(updateFine({ ...f, status: 'Paid' })).unwrap();
    });
  };

  const handleSave = async () => {
    if (!form.pcnRefNo?.trim()) {
      toast({ title: 'PCN reference is required', variant: 'destructive' });
      return;
    }

    if (!form.vehicleRegistration.trim()) {
      toast({ title: 'Vehicle registration is required', variant: 'destructive' });
      return;
    }

    if (!form.reasonOfCharge?.trim()) {
      toast({ title: 'Reason is required', variant: 'destructive' });
      return;
    }

    if (!form.location?.trim()) {
      toast({ title: 'Location is required', variant: 'destructive' });
      return;
    }

    if (!form.issueDate || !form.dueDate || !form.datetimeOfEvent) {
      toast({ title: 'Event, issue, and due dates are required', variant: 'destructive' });
      return;
    }

    if (!Number.isFinite(form.amount) || form.amount <= 0) {
      toast({ title: 'Amount must be greater than 0', variant: 'destructive' });
      return;
    }

    await runAction(editing ? 'PCN updated' : 'PCN logged', async () => {
      if (editing) {
        await dispatch(updateFine({ ...editing, ...form })).unwrap();
      } else {
        await dispatch(createFine(form)).unwrap();
      }
      setModalOpen(false);
    });
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: key === 'amount' ? Number(val) : val }));
  const setVehicleRegistration = (registration: string) => {
    setForm((current) => ({
      ...current,
      vehicleRegistration: registration,
    }));
  };

  const columns: Column<Fine>[] = [
    { key: 'pcnRefNo', header: 'PCN Ref', sortable: true, render: f => f.pcnRefNo || '-' },
    { key: 'vehicleRegistration', header: 'Vehicle', sortable: true, render: f => f.vehicleRegistration },
    { key: 'issueDate', header: 'Issued', sortable: true, render: f => formatDisplayDate(f.issueDate) },
    { key: 'dueDate', header: 'Due', sortable: true, render: f => formatDisplayDate(f.dueDate) },
    { key: 'amount', header: 'Amount', sortable: true, render: f => `£${f.amount}` },
    { key: 'status', header: 'Status', render: f => <StatusBadge status={f.status} /> },
    { key: 'actions', header: '', render: f => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openView(f); }}><Eye className="h-3.5 w-3.5" /></Button>
        {f.status === 'Unpaid' && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={e => { e.stopPropagation(); markPaid(f); }}>Mark Paid</Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEdit(f); }}><Pencil className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="PCNs / Fines" description="Track and manage fines" actionLabel="Log Fine" actionIcon={Plus} onAction={openCreate} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Unpaid" value={`£${unpaidTotal}`} icon={AlertTriangle} />
        <StatCard title="Total PCNs" value={fines.length} icon={AlertTriangle} />
        <StatCard title="Unpaid Count" value={fines.filter(f => f.status === 'Unpaid').length} icon={AlertTriangle} />
      </div>
      <DataTable columns={columns} data={fines} loading={loading} searchKeys={['pcnRefNo', 'vehicleRegistration', 'location']} searchPlaceholder="Search by PCN ref or registration..." filterKey="status" filterOptions={statusOpts} onRowClick={openView} />

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit PCN' : 'Log PCN'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="PCN Ref" name="pcnRefNo" value={form.pcnRefNo || ''} onChange={set('pcnRefNo')} placeholder="MC3456675" required />
          <FormField label="Vehicle Reg No" name="vehicleRegistration" value={form.vehicleRegistration} onChange={setVehicleRegistration} placeholder="GU65MSX" required />
          <FormField label="Amount (£)" name="amount" value={form.amount} onChange={set('amount')} type="number" required />
          <FormField label="Event Date" name="datetimeOfEvent" value={(form.datetimeOfEvent || '').slice(0, 10)} onChange={set('datetimeOfEvent')} type="date" required />
          <FormField label="Issue Date" name="issued" value={form.issueDate} onChange={set('issueDate')} type="date" required />
          <FormField label="Due Date" name="due" value={form.dueDate} onChange={set('dueDate')} type="date" required />
          <FormField label="Reason" name="reasonOfCharge" value={form.reasonOfCharge || ''} onChange={set('reasonOfCharge')} placeholder="Parking in no-parking area" required />
          <FormField label="Location" name="location" value={form.location || ''} onChange={set('location')} placeholder="Stoke-on-Trent" required />
          <FormField label="Status" name="status" value={form.status} onChange={set('status')} type="select" options={statusOpts} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Log PCN'}</Button>
        </div>
      </Modal>
    </div>
  );
}

