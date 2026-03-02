import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: Record<string, string>;
  className?: string;
}

const defaultVariants: Record<string, string> = {
  'Available': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Rented': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In Service': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Reserved': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Active': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Upcoming': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Scheduled': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Unpaid': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Paid': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Disputed': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Pickup': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Delivery': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const variants = variant || defaultVariants;
  const colorClass = variants[status] || 'bg-muted text-muted-foreground';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass, className)}>
      {status}
    </span>
  );
}
