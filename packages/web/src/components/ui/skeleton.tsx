import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-surface-200',
        className,
      )}
    />
  );
}

/** Skeleton for a card-like placeholder */
export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-soft space-y-3">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
