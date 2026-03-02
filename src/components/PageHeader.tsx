import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: ReactNode;
}

export function PageHeader({ title, description, actionLabel, actionIcon: ActionIcon, onAction, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm">
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
