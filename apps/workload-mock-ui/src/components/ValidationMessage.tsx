import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ValidationTone = 'error' | 'warning' | 'success';

const styles: Record<ValidationTone, { box: string; icon: typeof AlertCircle }> = {
  error: {
    box: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertCircle,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
  },
};

export function ValidationMessage({
  tone,
  title,
  children,
  className,
}: {
  tone: ValidationTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = styles[tone].icon;
  return (
    <div
      className={cn(
        'flex gap-2 rounded-lg border p-3 text-sm',
        styles[tone].box,
        className,
      )}
      role="status"
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>
      </div>
    </div>
  );
}
