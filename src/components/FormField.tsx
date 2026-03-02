import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ label, name, value, onChange, type = 'text', options, placeholder, error, required, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {type === 'select' && options ? (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger id={name}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input id={name} name={name} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
