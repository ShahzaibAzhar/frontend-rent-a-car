import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CreateVehicleRequest, DvlaVehicleData, VehicleCouncil } from '@/types';
import { createVehicle, getDvlaInfo, getVehicleCouncils } from '@/services/fleetService';

const vehicleTypeOptions = [
  { label: 'SUV', value: 'suv' },
  { label: 'Sedan', value: 'sedan' },
  { label: 'Hatchback', value: 'hatchback' },
  { label: 'Estate', value: 'estate' },
  { label: 'Van', value: 'van' },
  { label: 'Other', value: 'other' },
];

const transmissionOptions = [
  { label: 'Automatic', value: 'AUTO' },
  { label: 'Manual', value: 'MANUAL' },
];

const steeringOptions = [
  { label: 'Right', value: 'right' },
  { label: 'Left', value: 'left' },
];

const conditionOptions = [
  { label: 'Excellent', value: 'excellent' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
];

const booleanOptions = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

const emptyVehicleForm: CreateVehicleRequest = {
  registration_number: '',
  council: '',
  vin_number: '',
  total_buying_cost: '',
  vehicle_type: '',
  model: '',
  vehicle_size: '',
  transmission: '',
  body_type: '',
  steering: '',
  interior_color: '',
  tank_capacity: '',
  no_of_doors: '',
  bhp: '',
  mileage: '',
  mileage_limit: '',
  interior_condition: '',
  body_condition: '',
  tyre_condition: '',
  co2_emission: '',
  ulez_compliant: 'false',
};

const editableFields: Array<{
  key: keyof CreateVehicleRequest;
  label: string;
  type?: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}> = [
  { key: 'registration_number', label: 'Registration Number', placeholder: 'ETS-3-AAA112205', required: true },
  { key: 'council', label: 'Council', required: true },
  { key: 'vin_number', label: 'VIN Number', placeholder: '454623333', required: true },
  { key: 'total_buying_cost', label: 'Total Buying Cost', type: 'number', placeholder: '38400' },
  { key: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: vehicleTypeOptions },
  { key: 'model', label: 'Model', placeholder: 'ETS-land cruiser', required: true },
  { key: 'vehicle_size', label: 'Vehicle Size', placeholder: 'HTV' },
  { key: 'transmission', label: 'Transmission', type: 'select', options: transmissionOptions },
  { key: 'body_type', label: 'Body Type', placeholder: '5-door' },
  { key: 'steering', label: 'Steering', type: 'select', options: steeringOptions },
  { key: 'interior_color', label: 'Interior Color', placeholder: 'black' },
  { key: 'tank_capacity', label: 'Tank Capacity', type: 'number', placeholder: '65' },
  { key: 'no_of_doors', label: 'Number of Doors', type: 'number', placeholder: '5' },
  { key: 'bhp', label: 'BHP', type: 'number', placeholder: '230' },
  { key: 'mileage', label: 'Mileage', type: 'number', placeholder: '84400' },
  { key: 'mileage_limit', label: 'Mileage Limit', type: 'number', placeholder: '350000' },
  { key: 'interior_condition', label: 'Interior Condition', type: 'select', options: conditionOptions },
  { key: 'body_condition', label: 'Body Condition', type: 'select', options: conditionOptions },
  { key: 'tyre_condition', label: 'Tyre Condition', type: 'select', options: conditionOptions },
  { key: 'co2_emission', label: 'CO2 Emission', type: 'number', placeholder: '8.1' },
  { key: 'ulez_compliant', label: 'ULEZ Compliant', type: 'select', options: booleanOptions },
];

const dvlaDisplayFields: Array<{ key: keyof DvlaVehicleData; label: string }> = [
  { key: 'make', label: 'Make' },
  { key: 'fuel_type', label: 'Fuel Type' },
  { key: 'colour', label: 'Colour' },
  { key: 'engine_capacity', label: 'Engine Capacity' },
  { key: 'co2_emissions', label: 'CO2 Emissions' },
  { key: 'mot_status', label: 'MOT Status' },
  { key: 'mot_expiry_date', label: 'MOT Expiry Date' },
  { key: 'tax_status', label: 'Tax Status' },
  { key: 'tax_due_date', label: 'Tax Due Date' },
  { key: 'year_of_manufacture', label: 'Year Of Manufacture' },
  { key: 'type_approval', label: 'Type Approval' },
  { key: 'wheelplan', label: 'Wheelplan' },
  { key: 'month_of_first_registration', label: 'First Registration Month' },
  { key: 'month_of_first_dvla_registration', label: 'First DVLA Registration Month' },
  { key: 'date_of_last_v5c_issued', label: 'Last V5C Issued' },
  { key: 'euro_status', label: 'Euro Status' },
  { key: 'real_driving_emissions', label: 'Real Driving Emissions' },
  { key: 'art_end_date', label: 'ART End Date' },
  { key: 'revenue_weight', label: 'Revenue Weight' },
  { key: 'marked_for_export', label: 'Marked For Export' },
];

function formatDvlaValue(value: DvlaVehicleData[keyof DvlaVehicleData] | undefined) {
  if (value === undefined || value === null || value === '') {
    return 'Not available';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registrationInput, setRegistrationInput] = useState('');
  const [form, setForm] = useState<CreateVehicleRequest>(emptyVehicleForm);
  const [councils, setCouncils] = useState<VehicleCouncil[]>([]);
  const [councilsLoading, setCouncilsLoading] = useState(false);
  const [dvlaData, setDvlaData] = useState<DvlaVehicleData | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const dvlaSummary = useMemo(
    () => dvlaDisplayFields.map((field) => ({
      ...field,
      value: formatDvlaValue(dvlaData?.[field.key]),
    })),
    [dvlaData]
  );

  const councilOptions = useMemo(
    () => councils.map((council) => ({ label: council.name, value: council.name })),
    [councils],
  );

  useEffect(() => {
    let cancelled = false;

    const loadCouncils = async () => {
      setCouncilsLoading(true);
      try {
        const values = await getVehicleCouncils();
        if (!cancelled) {
          setCouncils(values);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load councils';
          toast({ title: 'Councils unavailable', description: message, variant: 'destructive' });
        }
      } finally {
        if (!cancelled) {
          setCouncilsLoading(false);
        }
      }
    };

    loadCouncils();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const setField = (key: keyof CreateVehicleRequest) => (value: string) => {
    setForm((current) => ({
      ...current,
      [key]: key === 'registration_number' ? value.toUpperCase() : value,
    }));
  };

  const applyDvlaToForm = (dvla: DvlaVehicleData) => {
    setForm((current) => ({
      ...current,
      registration_number: dvla.registration_number,
      co2_emission: dvla.co2_emissions ? String(dvla.co2_emissions) : current.co2_emission,
    }));
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRegistration = registrationInput.trim().toUpperCase();

    if (!normalizedRegistration) {
      toast({ title: 'Registration number required', variant: 'destructive' });
      return;
    }

    setSearching(true);
    try {
      const dvla = await getDvlaInfo({ registration_number: normalizedRegistration });
      setRegistrationInput(normalizedRegistration);
      setDvlaData(dvla);
      applyDvlaToForm(dvla);
      toast({
        title: 'Vehicle found',
        description: `${dvla.make} ${dvla.registration_number}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vehicle details';
      toast({ title: 'Search failed', description: message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!form.registration_number.trim()) {
      toast({ title: 'Registration number required', variant: 'destructive' });
      return;
    }

    if (!form.model.trim()) {
      toast({ title: 'Model is required', variant: 'destructive' });
      return;
    }

    if (!form.vin_number.trim()) {
      toast({ title: 'VIN number is required', variant: 'destructive' });
      return;
    }

    if (!form.council.trim()) {
      toast({ title: 'Council is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await createVehicle({
        ...form,
        registration_number: form.registration_number.trim().toUpperCase(),
      });
      toast({ title: 'Vehicle added to fleet' });
      navigate('/fleet');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create vehicle';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Vehicle" description="Search DVLA first, then review and save the vehicle record.">
        <Button variant="outline" size="sm" onClick={() => navigate('/fleet')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Fleet
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Registration Lookup</CardTitle>
          <CardDescription>Enter a registration number to fetch DVLA data and prefill matching vehicle fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSearch}>
            <FormField
              label="Registration Number"
              name="registration_lookup"
              value={registrationInput}
              onChange={(value) => setRegistrationInput(value.toUpperCase())}
              placeholder="LM60YYZ"
              required
              className="flex-1"
            />
            <Button type="submit" disabled={searching} className="sm:min-w-40">
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {searching ? 'Searching...' : 'Search Vehicle'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Vehicle Details</CardTitle>
            <CardDescription>These fields map directly to the vehicle create payload and remain editable after DVLA lookup.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {editableFields.map((field) => (
              <FormField
                key={field.key}
                label={field.label}
                name={field.key}
                value={form[field.key]}
                onChange={setField(field.key)}
                type={field.key === 'council' ? (councilOptions.length > 0 ? 'select' : 'text') : field.type}
                options={field.key === 'council' ? councilOptions : field.options}
                placeholder={field.key === 'council'
                  ? (councilsLoading ? 'Loading councils...' : 'Enter council')
                  : field.placeholder}
                required={field.required}
                className={field.key === 'model' ? 'sm:col-span-2' : undefined}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">DVLA Details</CardTitle>
            <CardDescription>Read-only DVLA information from the latest registration lookup.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {dvlaSummary.map((field) => (
              <div key={field.key} className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground break-words">{field.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => navigate('/fleet')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || searching}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Vehicle'}
        </Button>
      </div>
    </div>
  );
}