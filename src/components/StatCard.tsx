import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
