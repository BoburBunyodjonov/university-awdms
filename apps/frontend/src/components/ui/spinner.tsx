import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
};

/**
 * Tiny indeterminate spinner. Uses aria-live=polite + optional label so screen
 * readers announce the busy state.
 */
export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      <Loader2
        className={cn(SIZE[size], 'animate-spin text-zinc-500')}
        aria-hidden="true"
      />
      {label ? <span className="text-xs text-zinc-500">{label}</span> : null}
    </span>
  );
}
