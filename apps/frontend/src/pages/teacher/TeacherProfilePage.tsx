import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  ClipboardList,
  Download,
  UserPlus,
  User,
  Clock,
  Users,
} from 'lucide-react';
import { workloadTermBucket, type WorkloadCategory, type WorkloadType } from '@awdms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/page-loader';
import { useTeacherProfile } from '@/features/teacher-profile/api';
import { useMyWorkload } from '@/features/my-workload/api';
import { useAcademicYears } from '@/features/academic-years/api';
import { api } from '@/lib/api';
import { DataTable, Td, Th } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { formatPrimaryCoefficient } from '@/lib/workload-coefficient';
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

type CategoryFilter = 'all' | WorkloadCategory;
const HOURS_DECIMALS = 1;

export function TeacherProfilePage() {
  const { t } = useTranslation();
  const { data: years } = useAcademicYears();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useTeacherProfile();

  const [yearId, setYearId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<WorkloadType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [assignOpen, setAssignOpen] = useState(false);

  const effectiveYearId =
    yearId || years?.find((y) => y.isActive)?.id || years?.[0]?.id;

  const { data: wl, isLoading: wlLoading, error: wlError } =
    useMyWorkload(effectiveYearId);

  const items = wl?.assignedWorkloads ?? wl?.items ?? [];
  const teacher = wl?.teacher;
  const annualNorm = teacher?.annualNorm ?? profile?.annualNorm ?? 0;

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (typeFilter && i.workloadType !== typeFilter) return false;
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      return true;
    });
  }, [items, typeFilter, categoryFilter]);
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

  const filteredTotals = useMemo(() => {
    const totalHours = filteredItems.reduce((n, i) => n + i.plannedHours, 0);
    const auditoriumHours = filteredItems
      .filter((i) => i.category === 'auditorium')
      .reduce((n, i) => n + i.plannedHours, 0);
    const nonAuditoriumHours = filteredItems
      .filter((i) => i.category === 'non_auditorium')
      .reduce((n, i) => n + i.plannedHours, 0);
    return { totalHours, auditoriumHours, nonAuditoriumHours };
  }, [filteredItems]);

  const overHours = Math.max(0, filteredTotals.totalHours - annualNorm);
  const remainingHours = Math.max(0, annualNorm - filteredTotals.totalHours);
  const remainingKpiValue =
    annualNorm <= 0
      ? '—'
      : overHours > 0
        ? t('teacher_profile.kpi.over_norm', { hours: overHours.toFixed(1) })
        : t('teacher_profile.kpi.hours_left', { hours: remainingHours.toFixed(1) });

  const onExport = async () => {
    if (!effectiveYearId) return;
    const res = await api.get('/export/my/excel', {
      params: { academicYearId: effectiveYearId },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-workload-${effectiveYearId.slice(0, 8)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const err = profileError || wlError;
  if (err) {
    return (
      <Card className="border-amber-300 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          {(err as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? String(err)}
        </p>
      </Card>
    );
  }

  if ((profileLoading && !profile) || (wlLoading && !wl)) {
    return <PageLoader label={t('common.loading')} />;
  }

  const displayName = profile?.fullName ?? teacher?.fullName ?? '';
  const displayPosition = profile?.position ?? teacher?.position;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.profile')}
        </h1>
        <p className="text-xs text-zinc-500">{t('teacher_profile.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" aria-hidden="true" />
            {t('teacher_profile.card_title')}
          </CardTitle>
        </CardHeader>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label={t('teachers.fields.fullName')} value={displayName} />
          <Field label={t('teachers.fields.position')} value={displayPosition} />
          <Field
            label={t('teacher_profile.fields.degree_enum')}
            value={profile?.degree ?? teacher?.degree ?? '—'}
          />
          <Field
            label={t('teachers.fields.degreeName')}
            value={profile?.degreeName ?? teacher?.degreeName ?? '—'}
          />
          <Field
            label={t('teachers.fields.annualNorm')}
            value={`${annualNorm} h`}
          />
          <Field
            label={t('teacher_profile.kpi.total_hours')}
            value={`${items.reduce((n, i) => n + i.plannedHours, 0).toFixed(HOURS_DECIMALS)}h`}
          />
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {t('teachers.fields.hasScientificDegree')}
            </div>
            <div
              className={cn(
                'mt-0.5 flex items-center gap-1.5 text-sm font-medium',
                profile?.hasScientificDegree ? 'text-amber-900' : 'text-zinc-600',
              )}
            >
              {profile?.hasScientificDegree ? (
                <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
              ) : null}
              {profile
                ? profile.hasScientificDegree
                  ? t('common.yes')
                  : t('common.no')
                : '—'}
            </div>
          </div>
          {profile != null && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {t('teachers.fields.isActive')}
              </div>
              <div className="mt-0.5 text-sm text-zinc-800">
                {profile.isActive
                  ? t('teachers.status_active')
                  : t('teachers.status_inactive')}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label={t('teacher_profile.kpi.total_hours')}
          value={`${filteredTotals.totalHours.toFixed(1)}h`}
        />
        <Kpi
          label={t('teacher_profile.kpi.auditorium')}
          value={`${filteredTotals.auditoriumHours.toFixed(1)}h`}
        />
        <Kpi
          label={t('teacher_profile.kpi.non_auditorium')}
          value={`${filteredTotals.nonAuditoriumHours.toFixed(1)}h`}
        />
        <Kpi
          label={t('teacher_profile.kpi.remaining_norm')}
          value={remainingKpiValue}
          tone={
            annualNorm <= 0
              ? 'neutral'
              : overHours > 0
                ? 'warn'
                : 'ok'
          }
        />
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">{t('teacher_profile.workload_section')}</CardTitle>
        </CardHeader>
        <DataTable
          isLoading={wlLoading}
          toolbar={
            <div className="flex w-full flex-wrap items-center gap-2">
              <Select
                className="w-48"
                value={typeFilter}
                onValueChange={(v) => setTypeFilter((v as WorkloadType) || '')}
                clearable
                placeholder={t('teacher_profile.filter_type')}
                options={WORKLOAD_TYPES.map((wt) => ({
                  value: wt,
                  label: t(`workloadType.${wt}`),
                }))}
              />
              <Select
                className="w-44"
                value={categoryFilter}
                onValueChange={(v) =>
                  setCategoryFilter(v === 'all' ? 'all' : (v as WorkloadCategory))
                }
                options={[
                  { value: 'all', label: t('teacher_profile.all_categories') },
                  { value: 'auditorium', label: t('workload.category.auditorium') },
                  { value: 'non_auditorium', label: t('workload.category.non_auditorium') },
                ]}
              />
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={() => setAssignOpen(true)}>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('teacher_profile.assign_workload')}</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={onExport}
                  disabled={!effectiveYearId}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>{t('common.export_excel')}</span>
                </Button>
                <Select
                  className="w-40"
                  value={yearId || effectiveYearId}
                  onValueChange={(v) => setYearId(v ?? '')}
                  options={
                    years?.map((y) => ({
                      value: y.id,
                      label: y.isActive ? `★ ${y.name}` : y.name,
                    })) ?? []
                  }
                />
              </div>
            </div>
          }
        />
      </Card>

      <TermSection title={t('academicTerm.fall')} items={fallItems} isLoading={wlLoading} />
      <TermSection title={t('academicTerm.spring')} items={springItems} isLoading={wlLoading} />
      {unknownTermItems.length > 0 ? (
        <TermSection
          title={t('workload.unknown_term')}
          hint={t('workload.unknown_term_hint')}
          items={unknownTermItems}
          isLoading={wlLoading}
        />
      ) : null}

      <p className="text-center text-xs text-zinc-500">
        <Link
          className="inline-flex items-center gap-1 text-zinc-600 underline-offset-2 hover:underline"
          to="/teacher"
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
          {t('teacher_profile.open_workload')}
        </Link>
      </p>

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={t('teacher_profile.assign_modal_title')}
        footer={
          <Button type="button" onClick={() => setAssignOpen(false)}>
            {t('teacher_profile.assign_modal_dismiss')}
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-zinc-700">
          {t('teacher_profile.assign_modal_body')}
        </p>
      </Dialog>
    </div>
  );
}

function TermSection({
  title,
  hint,
  items,
  isLoading,
}: {
  title: string;
  hint?: string;
  items: NonNullable<ReturnType<typeof useMyWorkload>['data']>['items'];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const termHours = items.reduce((sum, item) => sum + item.plannedHours, 0);
  return (
    <Card>
      <CardHeader className="border-b border-zinc-100">
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
            <Th>{t('workload.fields.group_or_stream')}</Th>
            <Th className="text-right">{t('workload.fields.students')}</Th>
            <Th className="text-right">{t('workload.fields.coefficient')}</Th>
            <Th className="text-right">{t('workload.fields.hours')}</Th>
            <Th>{t('workload.fields.category_col')}</Th>
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
                    ? `${t('workload.stream_badge')} · ${
                        i.lectureStream.totalStudentCount
                      } ${t('workload.stream_students')}`
                    : '—'}
              </Td>
              <Td className="text-right tabular-nums">
                <span className="inline-flex items-center justify-end gap-1">
                  <Users className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                  {i.studentCount}
                </span>
              </Td>
              <Td className="text-right font-mono text-xs tabular-nums text-zinc-800">
                {formatPrimaryCoefficient(i.formulaConfig)}
              </Td>
              <Td className="text-right tabular-nums font-medium">
                <span className="inline-flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                  {i.plannedHours.toFixed(HOURS_DECIMALS)}
                </span>
              </Td>
              <Td className="text-sm text-zinc-700">
                {t(`workload.category.${i.category}`)}
              </Td>
            </tr>
          ))}
          {items.length > 0 ? (
            <tr className="bg-zinc-50">
              <Td colSpan={5} className="text-right text-xs font-semibold text-zinc-600">
                {t('common.total', { defaultValue: 'Jami' })}
              </Td>
              <Td className="text-right tabular-nums text-sm font-semibold text-zinc-900">
                {termHours.toFixed(HOURS_DECIMALS)}h
              </Td>
              <Td />
            </tr>
          ) : null}
        </tbody>
      </DataTable>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-zinc-900">{value}</div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'ok' | 'warn';
}) {
  return (
    <div
      className={cn(
        'awdms-surface p-3',
        tone === 'warn' && 'border-amber-300 bg-amber-50',
        tone === 'ok' && 'border-emerald-200 bg-emerald-50',
        tone === 'neutral' && 'border-zinc-200 bg-white',
      )}
    >
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 text-lg font-semibold',
          tone === 'warn' ? 'text-amber-900' : 'text-zinc-900',
        )}
      >
        {value}
      </div>
    </div>
  );
}
