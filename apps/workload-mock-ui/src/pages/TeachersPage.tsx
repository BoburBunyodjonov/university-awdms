import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AssignmentModal } from '@/components/AssignmentModal';
import { useWorkloadState, teacherStats } from '@/state/WorkloadState';
import { cn } from '@/lib/cn';
import type { Teacher } from '@/types';

export function TeachersPage() {
  const { teachers, assignments } = useWorkloadState();
  const [modalTeacher, setModalTeacher] = useState<Teacher | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Assign load, open profiles, and review norms in one place.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-sm font-medium text-zinc-500"
        >
          <UserPlus className="h-4 w-4" />
          Add teacher (disabled)
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card">
        <div className="max-h-[min(70vh,640px)] overflow-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">Total h</th>
                <th className="px-4 py-3">Auditorium h</th>
                <th className="px-4 py-3">Non-aud. h</th>
                <th className="px-4 py-3">Remaining norm</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No teachers in mock data.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => {
                  const s = teacherStats(t.id, assignments);
                  const rem = t.annualNorm - s.total;
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-zinc-100 transition hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">{t.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            t.degree === 'PhD'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-zinc-100 text-zinc-600',
                          )}
                        >
                          {t.degree === 'PhD' ? 'PhD' : 'No degree'}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {s.total.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {s.auditorium.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800">
                        {s.nonAuditorium.toFixed(1)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 font-medium tabular-nums',
                          rem < 0 ? 'text-rose-600' : 'text-emerald-700',
                        )}
                      >
                        {rem.toFixed(0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            to={`/teachers/${t.id}`}
                            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => setModalTeacher(t)}
                            className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalTeacher ? (
        <AssignmentModal
          open
          teacher={modalTeacher}
          onClose={() => setModalTeacher(null)}
        />
      ) : null}
    </div>
  );
}
