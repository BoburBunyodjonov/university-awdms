import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, BookOpen, Clock, Download, Users } from 'lucide-react';
import type { WorkloadType } from '@awdms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Td, Th } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/page-loader';
import { useMyWorkload } from '@/features/my-workload/api';
import { useAcademicYears } from '@/features/academic-years/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function TeacherDashboardPage() {
  const { t } = useTranslation();
  const { data: years } = useAcademicYears();
  const [yearId, setYearId] = useState<string>('');

  const effectiveYearId =
    yearId || years?.find((y) => y.isActive)?.id || years?.[0]?.id;

  const { data, isLoading, error } = useMyWorkload(effectiveYearId);

  const onDownload = async () => {
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

  if (error) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <p className="text-sm text-amber-900">
          {(error as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? String(error)}
        </p>
      </Card>
    );
  }

  if (isLoading && !data) {
    return <PageLoader label={t('common.loading')} />;
  }

  const overNorm =
    data?.teacher && data.totals.totalHours > data.teacher.annualNorm;
  const utilisation =
    data?.teacher && data.teacher.annualNorm > 0
      ? (data.totals.totalHours / data.teacher.annualNorm) * 100
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            {data?.teacher.fullName ?? t('my_workload.title')}
          </h1>
          {data?.teacher ? (
            <p className="text-xs text-zinc-600">
              {data.teacher.position} · {data.teacher.degreeName}
              {data.teacher.hasScientificDegree ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                  <Award className="h-3 w-3" aria-hidden="true" />
                  {t('teachers.degree_badge')}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Kpi
          label={t('my_workload.annual')}
          value={data ? `${data.totals.totalHours.toFixed(1)}h` : '—'}
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
          label={t('my_workload.fall')}
          value={data ? `${data.byTerm.fall.toFixed(1)}h` : '—'}
        />
        <Kpi
          label={t('my_workload.spring')}
          value={data ? `${data.byTerm.spring.toFixed(1)}h` : '—'}
        />
        <Kpi
          label={t('my_workload.category_split')}
          value={
            data
              ? `${data.totals.auditoriumHours.toFixed(0)} / ${data.totals.nonAuditoriumHours.toFixed(0)}h`
              : '—'
          }
          sub={t('my_workload.category_hint')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t('my_workload.items_title')}
          </CardTitle>
          <span className="text-xs text-zinc-500">
            {data?.totals.items ?? 0} {t('my_workload.items')}
          </span>
        </CardHeader>

        <DataTable
          isLoading={isLoading}
          empty={
            data && data.items.length === 0
              ? t('my_workload.empty')
              : undefined
          }
        >
          <thead>
            <tr>
              <Th>{t('workload.fields.subject')}</Th>
              <Th>{t('workload.fields.type')}</Th>
              <Th>{t('workload.fields.scope')}</Th>
              <Th className="text-right">{t('workload.fields.students')}</Th>
              <Th className="text-right">{t('workload.fields.hours')}</Th>
              <Th>{t('workload.fields.status')}</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((i) => (
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
                  </span>
                </Td>
                <Td className="text-xs text-zinc-700">
                  {i.lectureStream
                    ? `${t('workload.stream_of')} ${i.lectureStream.totalStudentCount}`
                    : ''}
                  {i.group ? (
                    <span className="block">
                      {t('workload.group')}: {i.group.name}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Users
                      className="h-3 w-3 text-zinc-400"
                      aria-hidden="true"
                    />
                    {i.studentCount}
                  </span>
                </Td>
                <Td className="text-right tabular-nums font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Clock
                      className="h-3 w-3 text-zinc-400"
                      aria-hidden="true"
                    />
                    {i.plannedHours.toFixed(1)}
                  </span>
                </Td>
                <Td>
                  <StatusBadge status={i.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>
    </div>
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
