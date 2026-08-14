import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-700',
  success: 'bg-success-light text-green-800',
  warning: 'bg-warning-light text-amber-800',
  danger: 'bg-danger-light text-red-800',
  info: 'bg-info-light text-blue-800',
  primary: 'bg-primary-100 text-primary-800',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
