import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createCustomerApi } from '@/features/customers/customerSlice';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errorMessage';
import { CreateCustomerRequest } from '@/types';

const titleOptions = [
  { label: 'Mr', value: 'mr' },
  { label: 'Mrs', value: 'mrs' },
  { label: 'Ms', value: 'ms' },
  { label: 'Miss', value: 'miss' },
  { label: 'Dr', value: 'dr' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const licenseTypeOptions = [
  { label: 'Learner', value: 'Learner' },
  { label: 'Provisional', value: 'Provisional' },
  { label: 'Full', value: 'Full' },
];

const emptyCustomerForm: CreateCustomerRequest = {
  title: 'mr',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: 'male',
  address: '',
  ni_number: '',
  profession: '',
  nationality: '',
  license_type: 'Learner',
  driver_license_number: '',
  license_issue_date: '',
  license_expiry_date: '',
  date_of_birth: '',
};

const customerFields: Array<{
  key: keyof CreateCustomerRequest;
  label: string;
  type?: 'text' | 'date' | 'email' | 'tel' | 'select' | 'password';
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}> = [
  { key: 'title', label: 'Title', type: 'select', options: titleOptions, required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: genderOptions, required: true },
  { key: 'first_name', label: 'First Name', placeholder: 'John', required: true },
  { key: 'last_name', label: 'Last Name', placeholder: 'Doe', required: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '03111111001', required: true },
  { key: 'profession', label: 'Profession', placeholder: 'Software engineer' },
  { key: 'address', label: 'Address', placeholder: 'Street, city, country', className: 'sm:col-span-2', required: true },
  { key: 'ni_number', label: 'NI Number', placeholder: '8455342344', required: true },
  { key: 'nationality', label: 'Nationality', placeholder: 'Pakistani', required: true },
  { key: 'license_type', label: 'License Type', type: 'select', options: licenseTypeOptions, required: true },
  { key: 'driver_license_number', label: 'Driver License Number', placeholder: '52222000', required: true },
  { key: 'license_issue_date', label: 'License Issue Date', type: 'date', required: true },
  { key: 'license_expiry_date', label: 'License Expiry Date', type: 'date', required: true },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
];

export default function AddCustomerPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateCustomerRequest>(emptyCustomerForm);
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof CreateCustomerRequest) => (value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'First name, last name, email, and phone are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await dispatch(createCustomerApi(form)).unwrap();
      toast({ title: 'Customer created' });
      navigate('/customers');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create customer');
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Customer" description="Create a customer profile with identity and driving licence details.">
        <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Customer Details</CardTitle>
          <CardDescription>These fields map directly to the customer create request payload.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {customerFields.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              name={field.key}
              value={form[field.key]}
              onChange={setField(field.key)}
              type={field.type}
              options={field.options}
              placeholder={field.placeholder}
              required={field.required}
              className={field.className}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => navigate('/customers')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Customer'}
        </Button>
      </div>
    </div>
  );
}