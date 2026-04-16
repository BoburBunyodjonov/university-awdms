import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Award,
  Download,
  Sparkles,
  Trash2,
  UserPlus,
  UserX,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { AssignmentStatus, WorkloadType } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { useAcademicYears } from '@/features/academic-years/api';
import {
  useDeleteWorkload,
  useUnassignWorkload,
  useWorkloadItems,
  type WorkloadItemWithRelations,
  type WorkloadQuery,
} from '@/features/workload/api';
import { AssignTeacherModal } from '@/features/workload/AssignTeacherModal';
import { GenerateWorkloadModal } from '@/features/workload/GenerateWorkloadModal';
import { cn } from '@/lib/utils';

const WORKLOAD_TYPES = [
  'lecture',
  'practice',
  'lab',
  'control',
  'course_project',
  'internship',
  'prediploma',
  'VQR',
  'MD',
  'NDP',
  'NS',
] as const;

export function WorkloadPage() {
  const { t } = useTranslation();
  const { data: years } = useAcademicYears();

  const [query, setQuery] = useState<WorkloadQuery>({ page: 1, pageSize: 50 });
  const activeYearId = useMemo(
    () =>
      years?.find((y) => y.isActive)?.id ?? years?.[0]?.id ?? undefined,
    [years],
  );

  // Seed the year filter once years have loaded.
  useEffect(() => {
    if (!query.academicYearId && activeYearId) {
      setQuery((q) => ({ ...q, academicYearId: activeYearId }));
    }
  }, [activeYearId, query.academicYearId]);

  const { data, isLoading } = useWorkloadItems(query);
  const unassignMut = useUnassignWorkload();
  const deleteMut = useDeleteWorkload();

  const [assignTarget, setAssignTarget] =
    useState<WorkloadItemWithRelations | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const totals = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: items.length,
      auditorium: items
        .filter((i) => i.category === 'auditorium')
        .reduce((n, i) => n + i.plannedHours, 0),
      nonAuditorium: items
        .filter((i) => i.category === 'non_auditorium')
        .reduce((n, i) => n + i.plannedHours, 0),
      unassigned: items.filter((i) => !i.assignedTeacherId).length,
    };
  }, [data]);

  const onDownloadExcel = async () => {
    if (!query.academicYearId) {
      toast.error(t('workload.export.needs_year'));
      return;
    }
    try {
      const res = await api.get('/export/department/excel', {
        params: { academicYearId: query.academicYearId },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `awdms-workload-${query.academicYearId.slice(0, 8)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onUnassign = async (item: WorkloadItemWithRelations) => {
    await unassignMut.mutateAsync(item.id).catch(() => {});
  };

  const onDelete = async (item: WorkloadItemWithRelations) => {
    if (!confirm(t('workload.confirm_delete'))) return;
    await deleteMut.mutateAsync(item.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.workload')}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onDownloadExcel}
            disabled={!query.academicYearId}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t('common.export_excel')}</span>
          </Button>
          <Button variant="secondary" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t('workload.generate.button')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard label={t('workload.kpi.total')} value={totals.total} />
        <KpiCard
          label={t('workload.kpi.auditorium')}
          value={`${totals.auditorium.toFixed(1)}h`}
        />
        <KpiCard
          label={t('workload.kpi.non_auditorium')}
          value={`${totals.nonAuditorium.toFixed(1)}h`}
        />
        <KpiCard
          label={t('workload.kpi.unassigned')}
          value={totals.unassigned}
          tone={totals.unassigned > 0 ? 'warn' : 'ok'}
        />
      </div>

      <DataTable
        isLoading={isLoading}
        empty={data && data.items.length === 0 ? t('common.empty') : undefined}
        toolbar={
          <>
            <Select
              className="w-44"
              value={query.academicYearId}
              onValueChange={(v) =>
                setQuery((q) => ({ ...q, page: 1, academicYearId: v }))
              }
              placeholder={t('workload.all_years')}
              clearable
              options={
                years?.map((y) => ({
                  value: y.id,
                  label: y.isActive ? `★ ${y.name}` : y.name,
                })) ?? []
              }
            />
            <Select
              className="w-40"
              value={query.workloadType}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  page: 1,
                  workloadType: v as WorkloadType | undefined,
                }))
              }
              placeholder={t('workload.all_types')}
              clearable
              options={WORKLOAD_TYPES.map((wt) => ({
                value: wt,
                label: t(`workloadType.${wt}`),
              }))}
            />
            <Select
              className="w-36"
              value={query.status}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  page: 1,
                  status: v as AssignmentStatus | undefined,
                }))
              }
              placeholder={t('streams.all_statuses')}
              clearable
              options={[
                { value: 'unassigned', label: t('status.unassigned') },
                { value: 'assigned', label: t('status.assigned') },
                { value: 'invalid', label: t('status.invalid') },
              ]}
            />
          </>
        }
        footer={
          data ? (
            <>
              <span>
                {t('common.page_of', {
                  page: data.page,
                  total: data.totalPages,
                })}
                {' · '}
                {data.total} {t('workload.total_suffix')}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() =>
                    setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))
                  }
                >
                  ‹
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() =>
                    setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))
                  }
                >
                  ›
                </Button>
              </div>
            </>
          ) : null
        }
      >
        <thead>
          <tr>
            <Th>{t('workload.fields.subject')}</Th>
            <Th>{t('workload.fields.type')}</Th>
            <Th>{t('workload.fields.scope')}</Th>
            <Th className="text-right">{t('workload.fields.students')}</Th>
            <Th className="text-right">{t('workload.fields.hours')}</Th>
            <Th>{t('workload.fields.teacher')}</Th>
            <Th>{t('workload.fields.status')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((i) => {
            const needsDegree = i.requiresDegree;
            const assignedMismatch =
              needsDegree &&
              i.assignedTeacher &&
              !i.assignedTeacher.hasScientificDegree;
            return (
              <tr key={i.id} className="hover:bg-zinc-50">
                <Td className="font-medium text-zinc-900">
                  {i.subjectOffering?.subject.name ?? '—'}
                  <div className="text-[10px] font-normal text-zinc-500">
                    {i.subjectOffering?.subject.direction.code}
                    {i.subjectOffering
                      ? ` · Y${i.subjectOffering.courseYear} · S${i.subjectOffering.semesterNumber}`
                      : ''}
                  </div>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {t(`workloadType.${i.workloadType as WorkloadType}`)}
                    {needsDegree ? (
                      <Award
                        className="h-3 w-3 text-amber-600"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {t(`category.${i.category}`)}
                  </div>
                </Td>
                <Td className="text-xs text-zinc-700">
                  {i.lectureStream ? (
                    <span>
                      {t('workload.stream_of')} {i.lectureStream.totalStudentCount}{' '}
                      · {t(`language.${i.lectureStream.language}`)}
                    </span>
                  ) : null}
                  {i.group ? (
                    <span className="block">
                      {t('workload.group')}: {i.group.name}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right tabular-nums">{i.studentCount}</Td>
                <Td className="text-right tabular-nums font-medium">
                  {i.plannedHours.toFixed(1)}
                </Td>
                <Td>
                  {i.assignedTeacher ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          assignedMismatch && 'text-red-700',
                        )}
                      >
                        {i.assignedTeacher.fullName}
                      </span>
                      {i.assignedTeacher.hasScientificDegree ? (
                        <Award
                          className="h-3 w-3 text-amber-600"
                          aria-hidden="true"
                        />
                      ) : null}
                      {assignedMismatch ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-red-700"
                          title={t('workload.assign.degree_mismatch_short')}
                        >
                          <AlertTriangle
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          {t('workload.assign.invalid')}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      {t('workload.no_teacher')}
                    </span>
                  )}
                </Td>
                <Td>
                  <StatusBadge status={i.status} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignTarget(i)}
                    >
                      <UserPlus
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      <span>
                        {i.assignedTeacher
                          ? t('workload.reassign')
                          : t('workload.assign_action')}
                      </span>
                    </Button>
                    {i.assignedTeacher ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnassign(i)}
                        className="text-zinc-700"
                      >
                        <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('workload.unassign')}</span>
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(i)}
                      className="text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('common.delete')}</span>
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <AssignTeacherModal
        open={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        item={assignTarget}
      />
      <GenerateWorkloadModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        defaultAcademicYearId={query.academicYearId}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'ok' | 'warn';
}) {
  return (
    <div
      className={cn(
        'awdms-surface p-3',
        tone === 'warn' && 'border-amber-300 bg-amber-50',
        tone === 'ok' && 'border-emerald-200 bg-emerald-50',
      )}
    >
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 text-xl font-semibold',
          tone === 'warn' ? 'text-amber-900' : 'text-zinc-900',
        )}
      >
        {value}
      </div>
    </div>
  );
}
