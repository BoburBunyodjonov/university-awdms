import { KIND_LABEL, type WorkloadAssignment } from '@/types';
import { cn } from '@/lib/cn';

const cols = [
  { key: 'kind', label: 'Type' },
  { key: 'subject', label: 'Subject' },
  { key: 'place', label: 'Group / Stream' },
  { key: 'students', label: 'Students' },
  { key: 'coefficient', label: 'Coeff.' },
  { key: 'hours', label: 'Hours' },
  { key: 'category', label: 'Category' },
] as const;

export function WorkloadTable({
  rows,
  emptyMessage = 'No workload rows for these filters.',
}: {
  rows: WorkloadAssignment[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
        <p className="text-sm font-medium text-zinc-600">No data</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card">
      <div className="max-h-[min(60vh,560px)] overflow-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50/95 shadow-[0_1px_0_0_rgba(228,228,231,0.9)] backdrop-blur">
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-zinc-100 transition hover:bg-zinc-50/80"
              >
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {KIND_LABEL[r.kind]}
                </td>
                <td className="px-4 py-3 text-zinc-700">{r.subjectName}</td>
                <td className="px-4 py-3 text-zinc-600">{r.groupOrStreamLabel}</td>
                <td className="px-4 py-3 tabular-nums text-zinc-800">{r.students}</td>
                <td className="px-4 py-3 tabular-nums text-zinc-800">
                  {r.coefficient}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 font-medium tabular-nums',
                    r.hours < 0 ? 'text-rose-600' : 'text-zinc-900',
                  )}
                >
                  {r.hours.toFixed(1)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      r.category === 'auditorium'
                        ? 'bg-indigo-50 text-indigo-800'
                        : 'bg-amber-50 text-amber-900',
                    )}
                  >
                    {r.category === 'auditorium' ? 'Auditorium' : 'Non-aud.'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
