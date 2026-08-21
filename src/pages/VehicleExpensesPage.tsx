import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCars, selectAllCars } from '@/features/fleet/fleetSlice';
import { DataTable, Column } from '@/components/DataTable';
import { FormField } from '@/components/FormField';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { VehicleExpense, VehicleExpenseCreateRequest, VehicleExpenseUpdateRequest } from '@/types';
import {
  createVehicleExpense,
  getVehicleExpenses,
  getVehicleExpensesByVehicleId,
  updateVehicleExpense,
} from '@/services/fleetService';
import { formatDisplayDate } from '@/lib/utils';

const typeOptions = [
  { label: 'Fuel', value: 'fuel' },
  { label: 'Service', value: 'service' },
  { label: 'Repair', value: 'repair' },
  { label: 'Tax', value: 'tax' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Other', value: 'other' },
];

const emptyForm = {
  vehicleId: '',
  type: 'other',
  mileage: '',
  totalAmount: '',
  paidAmount: '',
  date: '',
  paidDate: '',
  description: '',
};

export default function VehicleExpensesPage() {
  const dispatch = useAppDispatch();
  const cars = useAppSelector(selectAllCars);
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [form, setForm] = useState(emptyForm);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleExpense | null>(null);
  const [editForm, setEditForm] = useState({ type: 'other', mileage: '', totalAmount: '', paidAmount: '', date: '', paidDate: '', description: '' });

  useEffect(() => {
    dispatch(fetchCars());
  }, [dispatch]);

  const loadExpenses = async (vehicleId?: string) => {
    setLoading(true);
    try {
      let response: VehicleExpense[];

      if (vehicleId) {
        response = await getVehicleExpensesByVehicleId(vehicleId);
      } else {
        try {
          response = await getVehicleExpenses();
        } catch (error) {
          if (cars.length === 0) {
            throw error;
          }

          const nested = await Promise.allSettled(cars.map((car) => getVehicleExpensesByVehicleId(car.id)));
          response = nested
            .filter((item): item is PromiseFulfilledResult<VehicleExpense[]> => item.status === 'fulfilled')
            .flatMap((item) => item.value);
        }
      }

      setExpenses(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load expenses';
      toast({ title: 'Load failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVehicleId === 'all') {
      loadExpenses();
      return;
    }

    loadExpenses(selectedVehicleId);
  }, [selectedVehicleId, cars]);

  const vehicleOptions = useMemo(
    () => [
      { label: 'All vehicles', value: 'all' },
      ...cars.map((car) => ({ label: `${car.registrationNumber} - ${car.make} ${car.model}`, value: car.id })),
    ],
    [cars],
  );

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesQuery = !query || [
        expense.vehicleRegistration,
        expense.type,
        expense.description,
      ].some((value) => value.toLowerCase().includes(query));

      const expenseDate = expense.expenseDate ? new Date(expense.expenseDate) : null;
      const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
      const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

      const matchesFrom = !fromDate || (expenseDate && expenseDate >= fromDate);
      const matchesTo = !toDate || (expenseDate && expenseDate <= toDate);

      return matchesQuery && matchesFrom && matchesTo;
    });
  }, [expenses, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / Number(pageSize)));
  const currentPage = Math.min(page, totalPages);
  const pagedExpenses = useMemo(() => {
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredExpenses.slice(start, start + size);
  }, [filteredExpenses, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedVehicleId, searchQuery, dateFrom, dateTo, pageSize]);

  const setFormField = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.vehicleId) {
      toast({ title: 'Vehicle is required', variant: 'destructive' });
      return;
    }

    if (!form.mileage.trim() || !form.totalAmount.trim() || !form.date.trim() || !form.paidAmount.trim() || !form.paidDate.trim()) {
      toast({ title: 'Mileage, total amount, paid amount, date and paid date are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: VehicleExpenseCreateRequest = {
        type: form.type,
        mileage: form.mileage,
        total_amount: form.totalAmount,
        paid_amount: form.paidAmount,
        date: form.date,
        paid_date: form.paidDate,
        description: form.description.trim(),
      };

      await createVehicleExpense(form.vehicleId, payload);
      toast({ title: 'Expense created' });
      setForm(emptyForm);

      if (selectedVehicleId === 'all' || selectedVehicleId === form.vehicleId) {
        await loadExpenses(selectedVehicleId === 'all' ? undefined : selectedVehicleId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create expense';
      toast({ title: 'Create failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (expense: VehicleExpense) => {
    setEditing(expense);
    setEditForm({
      type: expense.type || 'other',
      mileage: String(expense.mileage || ''),
      totalAmount: String(expense.amount),
      paidAmount: String(expense.paidAmount),
      date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : '',
      paidDate: expense.paidDate ? expense.paidDate.slice(0, 10) : '',
      description: expense.description,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;

    if (!editForm.mileage.trim() || !editForm.totalAmount.trim() || !editForm.date.trim() || !editForm.paidAmount.trim() || !editForm.paidDate.trim()) {
      toast({ title: 'Mileage, total amount, paid amount, date and paid date are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: VehicleExpenseUpdateRequest = {
        type: editForm.type,
        mileage: editForm.mileage,
        total_amount: editForm.totalAmount,
        paid_amount: editForm.paidAmount,
        date: editForm.date,
        paid_date: editForm.paidDate,
        description: editForm.description.trim(),
      };

      await updateVehicleExpense(editing.id, payload);
      toast({ title: 'Expense updated' });
      setEditOpen(false);
      await loadExpenses(selectedVehicleId === 'all' ? undefined : selectedVehicleId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update expense';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<VehicleExpense>[] = [
    { key: 'vehicleRegistration', header: 'Vehicle', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'mileage', header: 'Mileage', sortable: true, render: (item) => item.mileage.toLocaleString() },
    { key: 'amount', header: 'Total Amount', sortable: true, render: (item) => `£${item.amount.toFixed(2)}` },
    { key: 'paidAmount', header: 'Paid Amount', sortable: true, render: (item) => `£${item.paidAmount.toFixed(2)}` },
    { key: 'expenseDate', header: 'Date', sortable: true, render: (item) => formatDisplayDate(item.expenseDate, '-') },
    { key: 'paidDate', header: 'Paid Date', sortable: true, render: (item) => formatDisplayDate(item.paidDate, '-') },
    { key: 'description', header: 'Description' },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => {
          event.stopPropagation();
          openEdit(item);
        }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicle Expenses" description="Track fuel, service, repair and other vehicle costs." />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Expense</CardTitle>
          <CardDescription>Add a new expense against a vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Vehicle" name="vehicle_id" value={form.vehicleId} onChange={setFormField('vehicleId')} type="select" options={vehicleOptions.filter((option) => option.value !== 'all')} required />
            <FormField label="Type" name="type" value={form.type} onChange={setFormField('type')} type="select" options={typeOptions} required />
            <FormField label="Mileage" name="mileage" value={form.mileage} onChange={setFormField('mileage')} type="number" required />
            <FormField label="Total Amount" name="total_amount" value={form.totalAmount} onChange={setFormField('totalAmount')} type="number" required />
            <FormField label="Paid Amount" name="paid_amount" value={form.paidAmount} onChange={setFormField('paidAmount')} type="number" required />
            <FormField label="Date" name="date" value={form.date} onChange={setFormField('date')} type="date" required />
            <FormField label="Paid Date" name="paid_date" value={form.paidDate} onChange={setFormField('paidDate')} type="date" required />
            <FormField label="Description" name="description" value={form.description} onChange={setFormField('description')} />
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Expense'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Expenses</CardTitle>
          <CardDescription>{loading ? 'Loading expenses...' : `${expenses.length} expense record(s)`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FormField label="Filter by Vehicle" name="filter_vehicle" value={selectedVehicleId} onChange={setSelectedVehicleId} type="select" options={vehicleOptions} />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Search</p>
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search vehicle/title/type/description" />
            </div>
            <FormField label="Date From" name="date_from" value={dateFrom} onChange={setDateFrom} type="date" />
            <FormField label="Date To" name="date_to" value={dateTo} onChange={setDateTo} type="date" />
            <FormField
              label="Rows per Page"
              name="page_size"
              value={pageSize}
              onChange={setPageSize}
              type="select"
              options={[
                { label: '10', value: '10' },
                { label: '25', value: '25' },
                { label: '50', value: '50' },
              ]}
            />
          </div>

          <DataTable
            columns={columns}
            data={pagedExpenses}
            loading={loading}
            emptyMessage="No expenses found"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(filteredExpenses.length === 0 ? 0 : ((currentPage - 1) * Number(pageSize) + 1))}
              {' '}-{' '}
              {Math.min(currentPage * Number(pageSize), filteredExpenses.length)} of {filteredExpenses.length}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</Button>
              <span className="text-xs text-muted-foreground">Page {currentPage} / {totalPages}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Expense">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type" name="edit_type" value={editForm.type} onChange={(value) => setEditForm((current) => ({ ...current, type: value }))} type="select" options={typeOptions} required />
          <FormField label="Mileage" name="edit_mileage" value={editForm.mileage} onChange={(value) => setEditForm((current) => ({ ...current, mileage: value }))} type="number" required />
          <FormField label="Total Amount" name="edit_total_amount" value={editForm.totalAmount} onChange={(value) => setEditForm((current) => ({ ...current, totalAmount: value }))} type="number" required />
          <FormField label="Paid Amount" name="edit_paid_amount" value={editForm.paidAmount} onChange={(value) => setEditForm((current) => ({ ...current, paidAmount: value }))} type="number" required />
          <FormField label="Date" name="edit_date" value={editForm.date} onChange={(value) => setEditForm((current) => ({ ...current, date: value }))} type="date" required />
          <FormField label="Paid Date" name="edit_paid_date" value={editForm.paidDate} onChange={(value) => setEditForm((current) => ({ ...current, paidDate: value }))} type="date" required />
          <FormField label="Description" name="edit_description" value={editForm.description} onChange={(value) => setEditForm((current) => ({ ...current, description: value }))} className="sm:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </Modal>
    </div>
  );
}
