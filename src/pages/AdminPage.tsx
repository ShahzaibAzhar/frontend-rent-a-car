import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchStaff, fetchDrivers,
  createStaff, updateStaff, deleteStaff,
  createDriver, updateDriver, deleteDriver,
  selectAllStaff, selectAllDrivers, selectAdminLoading, selectAdminError,
} from '@/features/admin/adminSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaffMember, Driver, CreateStaffRequest, UpdateStaffRequest, CreateDriverRequest, UpdateDriverRequest } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/utils';

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Operation failed';
}

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const licenseTypeOptions = [
  { label: 'Full', value: 'full' },
  { label: 'Provisional', value: 'provisional' },
  { label: 'Learner', value: 'learner' },
  { label: 'HGV', value: 'hgv' },
];

const emptyStaffCreate: CreateStaffRequest = {
  first_name: '', last_name: '', email: '', phone: '',
  gender: 'male', date_of_birth: '',
};

const emptyStaffUpdate: UpdateStaffRequest = { first_name: '', last_name: '', phone: '' };

const emptyDriverCreate: CreateDriverRequest = {
  first_name: '', last_name: '', email: '', phone: '',
  gender: 'male', date_of_birth: '', license_type: 'full', license_expiry: '', password: '',
};

const emptyDriverUpdate: UpdateDriverRequest = { first_name: '', last_name: '', phone: '' };

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const staff = useAppSelector(selectAllStaff);
  const drivers = useAppSelector(selectAllDrivers);
  const loading = useAppSelector(selectAdminLoading);
  const apiError = useAppSelector(selectAdminError);
  const { toast } = useToast();

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffDeleteOpen, setStaffDeleteOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffCreateForm, setStaffCreateForm] = useState<CreateStaffRequest>(emptyStaffCreate);
  const [staffUpdateForm, setStaffUpdateForm] = useState<UpdateStaffRequest>(emptyStaffUpdate);

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverDeleteOpen, setDriverDeleteOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverCreateForm, setDriverCreateForm] = useState<CreateDriverRequest>(emptyDriverCreate);
  const [driverUpdateForm, setDriverUpdateForm] = useState<UpdateDriverRequest>(emptyDriverUpdate);

  useEffect(() => {
    dispatch(fetchStaff());
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    if (apiError) toast({ title: 'Error', description: apiError, variant: 'destructive' });
  }, [apiError, toast]);

  const openCreateStaff = () => { setEditingStaff(null); setStaffCreateForm(emptyStaffCreate); setStaffModalOpen(true); };
  const openEditStaff = (member: StaffMember) => { setEditingStaff(member); setStaffUpdateForm({ first_name: member.first_name, last_name: member.last_name, phone: member.phone }); setStaffModalOpen(true); };
  const openDeleteStaff = (member: StaffMember) => { setEditingStaff(member); setStaffDeleteOpen(true); };

  const handleSaveStaff = async () => {
    try {
      if (editingStaff) {
        await dispatch(updateStaff({ id: editingStaff.id, payload: staffUpdateForm })).unwrap();
        toast({ title: 'Staff member updated' });
      } else {
        await dispatch(createStaff(staffCreateForm)).unwrap();
        toast({ title: 'Staff member added' });
      }
      setStaffModalOpen(false);
      dispatch(fetchStaff());
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrMsg(err), variant: 'destructive' });
    }
  };

  const handleDeleteStaff = async () => {
    if (!editingStaff) return;
    try {
      await dispatch(deleteStaff(editingStaff.id)).unwrap();
      toast({ title: 'Staff member removed', variant: 'destructive' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrMsg(err), variant: 'destructive' });
    }
    setStaffDeleteOpen(false);
  };

  const setCreateStaff = (key: keyof CreateStaffRequest) => (val: string) => setStaffCreateForm(f => ({ ...f, [key]: val }));
  const setUpdateStaff = (key: keyof UpdateStaffRequest) => (val: string) => setStaffUpdateForm(f => ({ ...f, [key]: val }));

  const openCreateDriver = () => { setEditingDriver(null); setDriverCreateForm(emptyDriverCreate); setDriverModalOpen(true); };
  const openEditDriver = (driver: Driver) => { setEditingDriver(driver); setDriverUpdateForm({ first_name: driver.first_name, last_name: driver.last_name, phone: driver.phone }); setDriverModalOpen(true); };
  const openDeleteDriver = (driver: Driver) => { setEditingDriver(driver); setDriverDeleteOpen(true); };

  const handleSaveDriver = async () => {
    try {
      if (editingDriver) {
        await dispatch(updateDriver({ id: editingDriver.id, payload: driverUpdateForm })).unwrap();
        toast({ title: 'Driver updated' });
      } else {
        await dispatch(createDriver(driverCreateForm)).unwrap();
        toast({ title: 'Driver added' });
      }
      setDriverModalOpen(false);
      dispatch(fetchDrivers());
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrMsg(err), variant: 'destructive' });
    }
  };

  const handleDeleteDriver = async () => {
    if (!editingDriver) return;
    try {
      await dispatch(deleteDriver(editingDriver.id)).unwrap();
      toast({ title: 'Driver removed', variant: 'destructive' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrMsg(err), variant: 'destructive' });
    }
    setDriverDeleteOpen(false);
  };

  const setCreateDriver = (key: keyof CreateDriverRequest) => (val: string) => setDriverCreateForm(f => ({ ...f, [key]: val }));
  const setUpdateDriver = (key: keyof UpdateDriverRequest) => (val: string) => setDriverUpdateForm(f => ({ ...f, [key]: val }));

  const staffColumns: Column<StaffMember>[] = [
    { key: 'first_name', header: 'First Name', sortable: true },
    { key: 'last_name', header: 'Last Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'gender', header: 'Gender', render: (m) => <span className="capitalize">{m.gender}</span> },
    { key: 'date_of_birth', header: 'Date of Birth', render: (m) => formatDisplayDate(m.date_of_birth) },
    { key: 'deleted', header: 'Status', render: (m) => <StatusBadge status={m.deleted ? 'Deleted' : 'Active'} /> },
    {
      key: 'actions', header: '', render: (m) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditStaff(m); }}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteStaff(m); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const driverColumns: Column<Driver>[] = [
    { key: 'first_name', header: 'First Name', sortable: true },
    { key: 'last_name', header: 'Last Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'license_type', header: 'License Type', render: (d) => <span className="capitalize">{d.license_type}</span> },
    { key: 'license_expiry', header: 'License Expiry', render: (d) => formatDisplayDate(d.license_expiry) },
    { key: 'deleted', header: 'Status', render: (d) => <StatusBadge status={d.deleted ? 'Deleted' : 'Active'} /> },
    {
      key: 'actions', header: '', render: (d) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditDriver(d); }}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteDriver(d); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Panel" description="Manage office staff and drivers" />

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Office Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="drivers">Drivers ({drivers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateStaff}><Plus className="mr-2 h-4 w-4" />Add Staff Member</Button>
          </div>
          <DataTable columns={staffColumns} data={staff} loading={loading} searchKeys={['first_name', 'last_name', 'email', 'phone']} searchPlaceholder="Search by name, email, phone..." />
        </TabsContent>

        <TabsContent value="drivers" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateDriver}><Plus className="mr-2 h-4 w-4" />Add Driver</Button>
          </div>
          <DataTable columns={driverColumns} data={drivers} loading={loading} searchKeys={['first_name', 'last_name', 'email', 'phone', 'license_type']} searchPlaceholder="Search by name, email, license..." />
        </TabsContent>
      </Tabs>

      <Modal open={staffModalOpen && !editingStaff} onOpenChange={setStaffModalOpen} title="Add Staff Member">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" name="first_name" value={staffCreateForm.first_name} onChange={setCreateStaff('first_name')} required />
          <FormField label="Last Name" name="last_name" value={staffCreateForm.last_name} onChange={setCreateStaff('last_name')} required />
          <FormField label="Email" name="email" value={staffCreateForm.email} onChange={setCreateStaff('email')} type="email" required />
          <FormField label="Phone" name="phone" value={staffCreateForm.phone} onChange={setCreateStaff('phone')} type="tel" required />
          <FormField label="Gender" name="gender" value={staffCreateForm.gender} onChange={setCreateStaff('gender')} type="select" options={genderOptions} />
          <FormField label="Date of Birth" name="date_of_birth" value={staffCreateForm.date_of_birth} onChange={setCreateStaff('date_of_birth')} type="date" required />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStaffModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStaff}>Add Staff Member</Button>
        </div>
      </Modal>

      <Modal open={staffModalOpen && !!editingStaff} onOpenChange={setStaffModalOpen} title="Edit Staff Member">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" name="first_name" value={staffUpdateForm.first_name} onChange={setUpdateStaff('first_name')} required />
          <FormField label="Last Name" name="last_name" value={staffUpdateForm.last_name} onChange={setUpdateStaff('last_name')} required />
          <FormField label="Phone" name="phone" value={staffUpdateForm.phone} onChange={setUpdateStaff('phone')} type="tel" required className="sm:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStaffModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStaff}>Update</Button>
        </div>
      </Modal>

      <Modal open={driverModalOpen && !editingDriver} onOpenChange={setDriverModalOpen} title="Add Driver">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" name="first_name" value={driverCreateForm.first_name} onChange={setCreateDriver('first_name')} required />
          <FormField label="Last Name" name="last_name" value={driverCreateForm.last_name} onChange={setCreateDriver('last_name')} required />
          <FormField label="Email" name="email" value={driverCreateForm.email} onChange={setCreateDriver('email')} type="email" required />
          <FormField label="Phone" name="phone" value={driverCreateForm.phone} onChange={setCreateDriver('phone')} type="tel" required />
          <FormField label="Gender" name="gender" value={driverCreateForm.gender} onChange={setCreateDriver('gender')} type="select" options={genderOptions} />
          <FormField label="Date of Birth" name="date_of_birth" value={driverCreateForm.date_of_birth} onChange={setCreateDriver('date_of_birth')} type="date" required />
          <FormField label="License Type" name="license_type" value={driverCreateForm.license_type} onChange={setCreateDriver('license_type')} type="select" options={licenseTypeOptions} />
          <FormField label="License Expiry" name="license_expiry" value={driverCreateForm.license_expiry} onChange={setCreateDriver('license_expiry')} placeholder="e.g. 22 55 77" required />
          <FormField label="Password" name="password" value={driverCreateForm.password} onChange={setCreateDriver('password')} type="password" required className="sm:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDriverModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDriver}>Add Driver</Button>
        </div>
      </Modal>

      <Modal open={driverModalOpen && !!editingDriver} onOpenChange={setDriverModalOpen} title="Edit Driver">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" name="first_name" value={driverUpdateForm.first_name} onChange={setUpdateDriver('first_name')} required />
          <FormField label="Last Name" name="last_name" value={driverUpdateForm.last_name} onChange={setUpdateDriver('last_name')} required />
          <FormField label="Phone" name="phone" value={driverUpdateForm.phone} onChange={setUpdateDriver('phone')} type="tel" required className="sm:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDriverModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDriver}>Update</Button>
        </div>
      </Modal>

      <ConfirmDialog open={staffDeleteOpen} onOpenChange={setStaffDeleteOpen} title="Remove Staff Member" description={`Are you sure you want to remove ${editingStaff?.first_name} ${editingStaff?.last_name}?`} onConfirm={handleDeleteStaff} confirmLabel="Remove" />
      <ConfirmDialog open={driverDeleteOpen} onOpenChange={setDriverDeleteOpen} title="Remove Driver" description={`Are you sure you want to remove ${editingDriver?.first_name} ${editingDriver?.last_name}?`} onConfirm={handleDeleteDriver} confirmLabel="Remove" />
    </div>
  );
}
