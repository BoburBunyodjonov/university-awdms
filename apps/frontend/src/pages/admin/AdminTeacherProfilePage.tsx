import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  Download,
  Plus,
  Users,
} from 'lucide-react';
import { workloadTermBucket, type Teacher, type WorkloadType } from '@awdms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Td, Th } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/page-loader';
import { useTeacherWorkload, useTeachers } from '@/features/teachers/api';
import { useAcademicYears } from '@/features/academic-years/api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import { AssignWorkloadToTeacherModal } from '@/features/workload/AssignWorkloadToTeacherModal';
import type { WorkloadItemWithRelations } from '@/features/workload/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const WORKLOAD_TYPES: WorkloadType[] = [
  'lecture',
  'practice',
  'lab',
  'control',
  'individual_project',
  'course_project',
  'internship',
  'prediploma',
  'VQR',
  'VQR_full_time',
  'VQR_part_time',
  'MD',
  'NDP',
  'NS',
  'phd_supervision_fulltime',
  'phd_supervision_parttime',
  'scientific_pedagogical',
  'scientific_internship',
];

const HOURS_DECIMALS = 1;

/**
 * Admin: view any teacher’s workload (GET /teachers/:id/workload) + Excel export
 * (GET /export/teacher/:id). Open from /admin/teachers table.
 */
export function AdminTeacherProfilePage() {
  const { t } = useTranslation();
  const { id: teacherId } = useParams<{ id: string }>();
  const { data: years } = useAcademicYears();
  const [yearId, setYearId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<WorkloadType | ''>('');
  const [assignOpen, setAssignOpen] = useState(false);

  // Fetch latest teacher record (for hours/norm used by AssignWorkloadModal)
  const { data: teachersList } = useTeachers({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
    isActive: true,
  });
  const teacherFull: Teacher | null = useMemo(() => {
    return teachersList?.items.find((tc) => tc.id === teacherId) ?? null;
  }, [teachersList, teacherId]);

  const effectiveYearId =
    yearId || years?.find((y) => y.isActive)?.id || years?.[0]?.id;

  const { data, isLoading, error } = useTeacherWorkload(teacherId, effectiveYearId);

  const items = data?.assignedWorkloads ?? data?.items ?? [];

  const filteredItems = useMemo(
    () => items.filter((i) => (typeFilter ? i.workloadType === typeFilter : true)),
    [items, typeFilter],
  );
  const fallItems = useMemo(
    () => filteredItems.filter((i) => workloadTermBucket(i) === 'fall'),
    [filteredItems],
  );
  const springItems = useMemo(
    () => filteredItems.filter((i) => workloadTermBucket(i) === 'spring'),
    [filteredItems],
  );
  const unknownTermItems = useMemo(
    () => filteredItems.filter((i) => workloadTermBucket(i) === 'unknown'),
    [filteredItems],
  );
  const totalCollectedHours = useMemo(
    () => items.reduce((sum, item) => sum + item.plannedHours, 0),
    [items],
  );

  const filteredTotals = useMemo(() => {
    const totalHours = filteredItems.reduce((n, i) => n + i.plannedHours, 0);
    const auditoriumHours = filteredItems
      .filter((i) => i.category === 'auditorium')
      .reduce((n, i) => n + i.plannedHours, 0);
    const nonAuditoriumHours = filteredItems
      .filter((i) => i.category === 'non_auditorium')
      .reduce((n, i) => n + i.plannedHours, 0);
    return { totalHours, auditoriumHours, nonAuditoriumHours, count: filteredItems.length };
  }, [filteredItems]);

  const onDownload = async () => {
    if (!teacherId || !effectiveYearId) return;
    const res = await api.get(`/export/teacher/${teacherId}`, {
      params: { academicYearId: effectiveYearId },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-${teacherId.slice(0, 8)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!teacherId) {
    return null;
  }

  if (error) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <p className="text-sm text-amber-900">
          {(error as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? String(error)}
        </p>
        <p className="mt-2">
          <Link
            to="/admin/teachers"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← {t('teachers.back_to_list')}
          </Link>
        </p>
      </Card>
    );
  }

  if (isLoading && !data) {
    return <PageLoader label={t('common.loading')} />;
  }

  const overNorm =
    data?.teacher && filteredTotals.totalHours > data.teacher.annualNorm;
  const utilisation =
    data?.teacher && data.teacher.annualNorm > 0
      ? (filteredTotals.totalHours / data.teacher.annualNorm) * 100
      : 0;

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/admin/teachers"
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('teachers.back_to_list')}
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">
          {data?.teacher.fullName ?? t('nav.profile')}
        </h1>
        <p className="text-xs text-zinc-500">{t('teachers.admin_profile_hint')}</p>
        {data?.teacher ? (
          <p className="text-xs text-zinc-600">
            {data.teacher.position} · {data.teacher.degreeName} ({data.teacher.degree})
            {data.teacher.hasScientificDegree ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                <Award className="h-3 w-3" aria-hidden="true" />
                {t('teachers.degree_badge')}
              </span>
            ) : null}
            <span className="ml-2 font-semibold text-zinc-800">
              · {t('teacher_profile.kpi.total_hours')}: {totalCollectedHours.toFixed(HOURS_DECIMALS)}h
            </span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="w-44"
            value={typeFilter}
            onValueChange={(v) => setTypeFilter((v as WorkloadType) || '')}
            clearable
            placeholder={t('my_workload.filter_type')}
            options={WORKLOAD_TYPES.map((wt) => ({
              value: wt,
              label: t(`workloadType.${wt}`),
            }))}
          />
          <Select
            className="w-44"
            value={yearId || effectiveYearId}
            onValueChange={(v) => setYearId(v ?? '')}
            options={
              years?.map((y) => ({
                value: y.id,
                label: y.isActive ? `★ ${y.name}` : y.name,
              })) ?? []
            }
          />
          <Button
            variant="secondary"
            onClick={onDownload}
            disabled={!effectiveYearId}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t('common.export_excel')}</span>
          </Button>
          <Button onClick={() => setAssignOpen(true)} disabled={!teacherFull}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('workload.assign_to_teacher.title')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi
          label={t('my_workload.annual')}
          value={`${filteredTotals.totalHours.toFixed(1)}h`}
          sub={
            data?.teacher
              ? t('my_workload.norm_hint', {
                  norm: data.teacher.annualNorm,
                  pct: utilisation.toFixed(0),
                })
              : undefined
          }
          tone={overNorm ? 'warn' : 'ok'}
        />
        <Kpi
          label={t('my_workload.auditorium_kpi')}
          value={`${filteredTotals.auditoriumHours.toFixed(1)}h`}
        />
        <Kpi
          label={t('my_workload.non_auditorium_kpi')}
          value={`${filteredTotals.nonAuditoriumHours.toFixed(1)}h`}
        />
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          unknownTermItems.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2',
        )}
      >
        <Kpi
          label={t('my_workload.fall')}
          value={`${fallItems.reduce((n, i) => n + i.plannedHours, 0).toFixed(HOURS_DECIMALS)}h`}
        />
        <Kpi
          label={t('my_workload.spring')}
          value={`${springItems.reduce((n, i) => n + i.plannedHours, 0).toFixed(HOURS_DECIMALS)}h`}
        />
        {unknownTermItems.length > 0 ? (
          <Kpi
            label={t('workload.unknown_term')}
            value={`${unknownTermItems.reduce((n, i) => n + i.plannedHours, 0).toFixed(HOURS_DECIMALS)}h`}
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t('my_workload.items_title')}
          </CardTitle>
          <span className="text-xs text-zinc-500">
            {filteredTotals.count} {t('my_workload.items')}
            {typeFilter ? ` (${t('common.filter')})` : ''}
          </span>
        </CardHeader>

      </Card>

      <TermWorkloadTable
        title={t('academicTerm.fall')}
        items={fallItems}
        isLoading={isLoading}
      />
      <TermWorkloadTable
        title={t('academicTerm.spring')}
        items={springItems}
        isLoading={isLoading}
      />
      {unknownTermItems.length > 0 ? (
        <TermWorkloadTable
          title={t('workload.unknown_term')}
          hint={t('workload.unknown_term_hint')}
          items={unknownTermItems}
          isLoading={isLoading}
        />
      ) : null}

      <AssignWorkloadToTeacherModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        teacher={teacherFull}
      />
    </div>
  );
}

function TermWorkloadTable({
  title,
  hint,
  items,
  isLoading,
}: {
  title: string;
  hint?: string;
  items: WorkloadItemWithRelations[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const termHours = items.reduce((sum, item) => sum + item.plannedHours, 0);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {hint ? (
            <p className="mt-1.5 text-xs leading-snug text-zinc-500">{hint}</p>
          ) : null}
        </div>
      </CardHeader>
      <DataTable
        isLoading={isLoading}
        empty={items.length === 0 ? t('my_workload.empty') : undefined}
      >
        <thead>
          <tr>
            <Th>{t('workload.fields.type')}</Th>
            <Th>{t('workload.fields.subject')}</Th>
            <Th>{t('workload.group')}</Th>
            <Th className="text-right">{t('workload.fields.students')}</Th>
            <Th className="text-right">{t('workload.fields.hours')}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="hover:bg-zinc-50">
              <Td>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                  {t(`workloadType.${i.workloadType as WorkloadType}`)}
                </span>
              </Td>
              <Td className="font-medium text-zinc-900">
                {i.subjectOffering?.subject.name ?? '—'}
                {i.subjectOffering ? (
                  <div className="text-[10px] font-normal text-zinc-500">
                    {[`Y${i.subjectOffering.courseYear}`, `S${i.subjectOffering.semesterNumber}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                ) : null}
              </Td>
              <Td className="text-xs text-zinc-700">
                {i.group
                  ? i.group.name
                  : i.lectureStream
                    ? `${t('workload.stream_badge')} · ${i.lectureStream.language} · ${
                        i.lectureStream.totalStudentCount
                      } ${t('workload.stream_students')}`
                    : '—'}
              </Td>
              <Td className="text-right tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                  {i.studentCount}
                </span>
              </Td>
              <Td className="text-right tabular-nums font-medium">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                  {i.plannedHours.toFixed(HOURS_DECIMALS)}
                </span>
              </Td>
            </tr>
          ))}
          {items.length > 0 ? (
            <tr className="bg-zinc-50">
              <Td colSpan={4} className="text-right text-xs font-semibold text-zinc-600">
                {t('common.total', { defaultValue: 'Jami' })}
              </Td>
              <Td className="text-right tabular-nums text-sm font-semibold text-zinc-900">
                {termHours.toFixed(HOURS_DECIMALS)}h
              </Td>
            </tr>
          ) : null}
        </tbody>
      </DataTable>
    </Card>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
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
      {sub ? <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div> : null}
    </div>
  );
}
