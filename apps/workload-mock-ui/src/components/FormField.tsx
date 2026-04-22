import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { fieldSurface } from '@/lib/fieldStyles';

/**
 * Reusable label + control wrapper for the assignment modal (error / warning rings).
 */
export function FormField({
  label,
  hint,
  error,
  warning,
  disabled,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: boolean;
  warning?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className={fieldSurface({ error, warning, disabled })}>{children}</div>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
