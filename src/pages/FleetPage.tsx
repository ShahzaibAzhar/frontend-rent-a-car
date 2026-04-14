import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCars, selectAllCars, selectFleetLoading, createCar, updateCar, deleteCar, fetchCarByRegistrationNumber, selectSelectedCar, selectFleetError, setSelectedCar, createVehicleApi } from '@/features/fleet/fleetSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Car, CarStatus, DvlaResponse } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusOptions = [
  { label: 'Available', value: 'Available' },
  { label: 'Rented', value: 'Rented' },
  { label: 'In Service', value: 'In Service' },
  { label: 'Reserved', value: 'Reserved' },
];

const emptyCar = { registrationNumber: '', make: '', model: '', year: new Date().getFullYear(), mileage: 0, status: 'Available' as CarStatus, motExpiry: '', insuranceExpiry: '' };

export default function FleetPage() {
  const dispatch = useAppDispatch();
  const cars = useAppSelector(selectAllCars);
  const loading = useAppSelector(selectFleetLoading);
  const selectedCar = useAppSelector(selectSelectedCar);
  const error = useAppSelector(selectFleetError);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [registrationInput, setRegistrationInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState(emptyCar);
  const [isFromDvlaLookup, setIsFromDvlaLookup] = useState(false);

  useEffect(() => { dispatch(fetchCars()); }, [dispatch]);

  useEffect(() => {
    if (selectedCar && !editing) {
      // Map DVLA API response to form fields
      const dvlaData = selectedCar as DvlaResponse['data']['dvla'];
      const mappedCar: typeof emptyCar = {
        registrationNumber: dvlaData.registration_number,
        make: dvlaData.make,
        model: '', // DVLA doesn't provide model, user can fill this
        year: dvlaData.year_of_manufacture,
        mileage: 0, // DVLA doesn't provide mileage, user can fill this
        status: 'Available' as CarStatus,
        motExpiry: dvlaData.tax_due_date || '', // Use tax due date as MOT expiry approximation
        insuranceExpiry: dvlaData.tax_due_date || '', // Use tax due date as insurance expiry approximation
      };
      setForm(mappedCar);
      setIsFromDvlaLookup(true);
      setRegistrationDialogOpen(false);
      setModalOpen(true);
    }
  }, [selectedCar, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCar);
    setRegistrationInput('');
    setIsFromDvlaLookup(false);
    setRegistrationDialogOpen(true);
  };

  const handleRegistrationLookup = async () => {
    if (!registrationInput.trim()) {
      toast({ title: 'Please enter a registration number', variant: 'destructive' });
      return;
    }
    try {
      const result = await dispatch(fetchCarByRegistrationNumber(registrationInput)).unwrap();
      toast({ title: 'Vehicle found', description: `${result.make} - ${result.registration_number}` });
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to fetch vehicle details';
      toast({ title: 'Search failed', description: errorMsg, variant: 'destructive' });
    }
  };

  const handleSkipLookup = () => {
    setRegistrationDialogOpen(false);
    setForm(emptyCar);
    setIsFromDvlaLookup(false);
    setModalOpen(true);
  };

  const openEdit = (car: Car) => { setEditing(car); setForm(car); setModalOpen(true); };
  const openDelete = (car: Car) => { setEditing(car); setDeleteOpen(true); };

  const handleSave = async () => {
    if (editing) {
      await dispatch(updateCar({ ...editing, ...form }));
      toast({ title: 'Vehicle updated' });
    } else {
      if (isFromDvlaLookup) {
        await dispatch(createVehicleApi(form));
        toast({ title: 'Vehicle added to fleet' });
      } else {
        await dispatch(createCar(form));
        toast({ title: 'Vehicle added' });
      }
    }
    setModalOpen(false);
    dispatch(setSelectedCar(null));
    setIsFromDvlaLookup(false);
  };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteCar(editing.id)); toast({ title: 'Vehicle deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: key === 'year' || key === 'mileage' ? Number(val) : val }));

  const columns: Column<Car>[] = [
    { key: 'registrationNumber', header: 'Reg No.', sortable: true },
    { key: 'make', header: 'Make', sortable: true },
    { key: 'model', header: 'Model', sortable: true },
    { key: 'year', header: 'Year', sortable: true },
    { key: 'mileage', header: 'Mileage', sortable: true, render: (c) => c.mileage.toLocaleString() },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'motExpiry', header: 'MOT Expiry' },
    { key: 'actions', header: '', render: (c) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); openDelete(c); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet Management" description="Manage your vehicle fleet" actionLabel="Add Vehicle" actionIcon={Plus} onAction={openCreate} />
      <DataTable columns={columns} data={cars} loading={loading} searchKeys={['registrationNumber', 'make', 'model']} searchPlaceholder="Search by reg, make, model..." filterKey="status" filterOptions={statusOptions} />
      <Modal open={registrationDialogOpen} onOpenChange={setRegistrationDialogOpen} title="Lookup Vehicle Details">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter the registration number to fetch vehicle details and pre-fill the form.</p>
          <FormField label="Registration Number" name="reg" value={registrationInput} onChange={setRegistrationInput} placeholder="e.g., AB12 CDE" required />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSkipLookup}>Skip & Enter Manually</Button>
            <Button onClick={handleRegistrationLookup} disabled={loading}>{loading ? 'Searching...' : 'Search Vehicle'}</Button>
          </div>
        </div>
      </Modal>
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Registration" name="reg" value={form.registrationNumber} onChange={set('registrationNumber')} required />
          <FormField label="Make" name="make" value={form.make} onChange={set('make')} required />
          <FormField label="Model" name="model" value={form.model} onChange={set('model')} required />
          <FormField label="Year" name="year" value={form.year} onChange={set('year')} type="number" />
          <FormField label="Mileage" name="mileage" value={form.mileage} onChange={set('mileage')} type="number" />
          <FormField label="Status" name="status" value={form.status} onChange={set('status')} type="select" options={statusOptions} />
          <FormField label="MOT Expiry" name="mot" value={form.motExpiry} onChange={set('motExpiry')} type="date" />
          <FormField label="Insurance Expiry" name="ins" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} type="date" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Add Vehicle'}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Vehicle" description={`Are you sure you want to delete ${editing?.registrationNumber}?`} onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
