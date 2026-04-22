import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, UserPlus } from 'lucide-react';
import { AssignmentModal } from '@/components/AssignmentModal';
import { FiltersPanel } from '@/components/FiltersPanel';
import { SummaryCards } from '@/components/SummaryCards';
import { WorkloadTable } from '@/components/WorkloadTable';
import { getTeacherById } from '@/mock/data';
import { teacherStats, useWorkloadState } from '@/state/WorkloadState';
import type { SemesterFilter, WorkloadCategory, WorkloadKind } from '@/types';
import { ValidationMessage } from '@/components/ValidationMessage';

export function TeacherProfilePage() {
  const { id } = useParams();
  const teacher = useMemo(() => getTeacherById(id ?? ''), [id]);
  const { assignments } = useWorkloadState();
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [semester, setSemester] = useState<SemesterFilter>('all');
  const [type, setType] = useState<WorkloadKind | 'all'>('all');
  const [category, setCategory] = useState<WorkloadCategory | 'all'>('all');

  const mine = useMemo(
    () => assignments.filter((a) => a.teacherId === id),
    [assignments, id],
  );

  const filtered = useMemo(() => {
    return mine.filter((a) => {
      if (semester !== 'all' && a.semester !== semester) return false;
      if (type !== 'all' && a.kind !== type) return false;
      if (category !== 'all' && a.category !== category) return false;
      return true;
    });
  }, [mine, semester, type, category]);

  const stats = teacher ? teacherStats(teacher.id, assignments) : null;
  const remaining = teacher ? teacher.annualNorm - (stats?.total ?? 0) : 0;

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      window.alert('Excel export (mock): file would download here.');
    }, 900);
  }

  if (!teacher) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Teacher not found.
        <Link to="/teachers" className="ml-2 underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/teachers"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All teachers
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {teacher.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {teacher.position} · Annual norm {teacher.annualNorm}h
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <UserPlus className="h-4 w-4" />
            Assign workload
          </button>
        </div>
      </div>

      {remaining < 0 ? (
        <ValidationMessage tone="warning" title="Over norm">
          This teacher exceeds the annual norm by{' '}
          {Math.abs(remaining).toFixed(0)}h — adjust assignments.
        </ValidationMessage>
      ) : (
        <ValidationMessage tone="success" title="Within planning range">
          Remaining norm is positive — you can still add safe assignments.
        </ValidationMessage>
      )}

      <SummaryCards
        items={[
          {
            label: 'Total hours',
            value: `${(stats?.total ?? 0).toFixed(1)}h`,
            variant: 'indigo',
          },
          {
            label: 'Auditorium hours',
            value: `${(stats?.auditorium ?? 0).toFixed(1)}h`,
            variant: 'emerald',
          },
          {
            label: 'Non-auditorium hours',
            value: `${(stats?.nonAuditorium ?? 0).toFixed(1)}h`,
            variant: 'amber',
          },
          {
            label: 'Remaining norm',
            value: `${remaining.toFixed(0)}h`,
            hint: `Target ${teacher.annualNorm}h`,
            variant: remaining < 0 ? 'rose' : 'default',
          },
        ]}
      />

      <FiltersPanel
        semester={semester}
        onSemester={setSemester}
        type={type}
        onType={setType}
        category={category}
        onCategory={setCategory}
      />

      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Workload table</h2>
        <p className="text-xs text-zinc-500">
          Sticky header — scrolls on small screens.
        </p>
        <div className="mt-3">
          <WorkloadTable
            rows={filtered}
            emptyMessage="Try relaxing filters or assign new workload."
          />
        </div>
      </div>

      {modalOpen ? (
        <AssignmentModal
          open
          teacher={teacher}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
