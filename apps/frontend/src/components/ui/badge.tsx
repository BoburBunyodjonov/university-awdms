import type { ComponentType, ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Loader2,
} from 'lucide-react';
import type { AssignmentStatus, StreamStatus } from '@awdms/shared';
import { STATUS_COLOR } from '@awdms/shared';
import { cn } from '@/lib/utils';

type Status = AssignmentStatus | StreamStatus;

const ICONS: Record<Status, ComponentType<{ className?: string }>> = {
  assigned: CheckCircle2,
  unassigned: CircleSlash,
  invalid: AlertTriangle,
  draft: CircleDashed,
  ready: Loader2,
};

interface BadgeProps {
  status: Status;
  children?: ReactNode;
  className?: string;
}

// §9.3 — icon + text, never icon-only. Colors sourced from
// the shared STATUS_COLOR map so they never drift from backend reports.
export function StatusBadge({ status, children, className }: BadgeProps) {
  const tone = STATUS_COLOR[status];
  const Icon = ICONS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        tone.bg,
        tone.text,
        tone.border,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{children ?? tone.label}</span>
    </span>
  );
}
