import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';
import type { ViewMode } from '@awdms/shared';
import { cn } from '@/lib/utils';

// §9.4 — sticky-header table primitive with filter/search/pagination slots.
// `viewMode` (§9.6) is accepted so concrete views can render grouped variants.
interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  viewMode?: ViewMode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

export function DataTable({
  viewMode = 'flat',
  toolbar,
  footer,
  empty,
  isLoading,
  className,
  children,
  ...props
}: DataTableProps) {
  return (
    <div className="awdms-surface overflow-hidden">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2">
          {toolbar}
        </div>
      ) : null}
      <div className="max-h-[calc(100vh-260px)] overflow-auto">
        <table
          data-view-mode={viewMode}
          className={cn('w-full border-collapse text-sm', className)}
          {...props}
        >
          {children}
        </table>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : null}
        {!isLoading && empty ? (
          <div className="p-6 text-center text-sm text-zinc-500">{empty}</div>
        ) : null}
      </div>
      {footer ? (
        <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-xs text-zinc-600">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function Th({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn('awdms-table-header px-3 py-2', className)}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('border-b border-zinc-100 px-3 py-2 align-middle', className)}
      {...props}
    />
  );
}

/**
 * Placeholder rows rendered in place of the body while the initial fetch is
 * in flight. Rendered outside the <table> so we don't need to know the column
 * count — a stack of shimmering bars gives the same spatial hint.
 */
function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex h-8 items-center gap-3 rounded bg-zinc-50 px-3"
        >
          <span className="h-3 w-1/4 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-1/5 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-1/6 animate-pulse rounded bg-zinc-200" />
          <span className="ml-auto h-3 w-1/12 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}
