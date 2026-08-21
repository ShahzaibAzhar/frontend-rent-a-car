import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import {
  fetchCustomers,
  selectAllCustomers,
  selectCustomersLoading,
} from '@/features/customers/customerSlice';
import { Customer } from '@/types';
import { formatDisplayDate } from '@/lib/utils';

function formatText(value: string) {
  return value ? value.replace(/(^\w|[-\s]\w)/g, (letter) => letter.toUpperCase()) : 'N/A';
}

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const customers = useAppSelector(selectAllCustomers);
  const loading = useAppSelector(selectCustomersLoading);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const licenseTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(new Set(customers.map((customer) => customer.license_type).filter(Boolean)));
    return uniqueTypes.map((licenseType) => ({
      label: formatText(licenseType),
      value: licenseType,
    }));
  }, [customers]);

  const columns: Column<Customer>[] = [
    {
      key: 'first_name',
      header: 'Customer',
      sortable: true,
      render: (customer) => `${formatText(customer.title)} ${customer.first_name} ${customer.last_name}`,
    },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    {
      key: 'gender',
      header: 'Gender',
      sortable: true,
      render: (customer) => formatText(customer.gender),
    },
    {
      key: 'license_type',
      header: 'License Type',
      sortable: true,
      render: (customer) => formatText(customer.license_type),
    },
    { key: 'driver_license_number', header: 'License No.' },
    { key: 'nationality', header: 'Nationality', render: (customer) => formatText(customer.nationality) },
    { key: 'date_of_birth', header: 'Date of Birth', sortable: true, render: (customer) => formatDisplayDate(customer.date_of_birth) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer records and licensing details."
        actionLabel="Add Customer"
        actionIcon={Plus}
        onAction={() => navigate('/customers/add')}
      />
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchKeys={['first_name', 'last_name', 'email', 'phone', 'driver_license_number']}
        searchPlaceholder="Search customers by name, email, phone..."
        filterKey="license_type"
        filterOptions={licenseTypeOptions}
        filterLabel="License Type"
        emptyMessage="No customers found"
      />
    </div>
  );
}