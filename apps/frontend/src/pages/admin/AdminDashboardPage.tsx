import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Hourglass,
  Layers,
  UserCheck,
  Users,
} from 'lucide-react';
import type { WorkloadType } from '@awdms/shared';
import { useAcademicYears } from '@/features/academic-years/api';
import {
  useMonitoringSummary,
  useRecentAssignments,
} from '@/features/monitoring/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/page-loader';
import { DataTable, Td, Th } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  auditorium: '#3b82f6',
  non_auditorium: '#f59e0b',
};

/** Avoids "Cannot read properties of undefined (reading 'toFixed')" on API edges. */
function fmtHours(value: unknown, fractionDigits = 1): string {
  const x = Number(value);
  return Number.isFinite(x) ? x.toFixed(fractionDigits) : (0).toFixed(fractionDigits);
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data: years } = useAcademicYears();
  const [yearId, setYearId] = useState<string>('');

  // Default to the active year once loaded.
  const activeYearId = useMemo(
    () =>
      years?.find((y) => y.isActive)?.id ?? years?.[0]?.id ?? undefined,
    [years],
  );
  const effectiveYearId = yearId || activeYearId;

  const { data: summary, isLoading } =
    useMonitoringSummary(effectiveYearId);

  const { data: recent = [], isLoading: recentLoading } = useRecentAssignments(
    effectiveYearId,
    20,
  );

  const actionLabel = useMemo(
    () => ({
      assign: t('dashboard.assignmentAction.assign'),
      reassign: t('dashboard.assignmentAction.reassign'),
      unassign: t('dashboard.assignmentAction.unassign'),
    }),
    [t],
  );

  const categoryChartData = useMemo(
    () =>
      (summary?.byCategory ?? []).map((c) => ({
        name: t(`category.${c.category}`),
        value: c.hours,
        key: c.category,
      })),
    [summary, t],
  );

  const typeChartData = useMemo(
    () =>
      (summary?.byType ?? []).map((tItem) => ({
        type: t(`workloadType.${tItem.type as WorkloadType}`),
        hours: tItem.hours,
      })),
    [summary, t],
  );

  const teacherChartData = useMemo(
    () =>
      (summary?.teachers ?? []).slice(0, 12).map((tl) => {
        const assigned = Number(tl.assignedHours ?? 0);
        const safe = Number.isFinite(assigned) ? assigned : 0;
        return {
          name: tl.fullName.split(' ').slice(-1)[0] ?? tl.fullName,
          fullName: tl.fullName,
          assigned: Math.round(safe * 10) / 10,
          norm: Number(tl.annualNorm ?? 0) || 0,
          over: (Number(tl.delta ?? 0) || 0) > 0,
        };
      }),
    [summary],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('dashboard.title')}
        </h1>
        <Select
          className="w-48"
          value={yearId || activeYearId}
          onValueChange={(v) => setYearId(v ?? '')}
          placeholder={t('workload.all_years')}
          options={
            years?.map((y) => ({
              value: y.id,
              label: y.isActive ? `★ ${y.name}` : y.name,
            })) ?? []
          }
        />
      </div>

      {isLoading && !summary ? <PageLoader label={t('common.loading')} /> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          icon={Layers}
          label={t('dashboard.kpi.totalDepartmentHours')}
          value={
            summary ? `${fmtHours(summary.totals.totalHours)}h` : '—'
          }
        />
        <KpiCard
          icon={CheckCircle2}
          label={t('dashboard.kpi.assignedHours')}
          value={
            summary
              ? `${fmtHours(summary.totals.assignedHours)}h`
              : '—'
          }
        />
        <KpiCard
          icon={Hourglass}
          label={t('dashboard.kpi.remainingNormHours')}
          value={
            summary
              ? `${fmtHours(summary.totals.remainingNormHours)}h`
              : '—'
          }
          sub={
            summary
              ? t('dashboard.kpi.deptNormHint', {
                  hours: fmtHours(summary.totals.totalDepartmentNorm, 0),
                })
              : undefined
          }
        />
        <KpiCard
          icon={UserCheck}
          label={t('dashboard.kpi.teacherCount')}
          value={summary?.totals.activeTeacherCount ?? '—'}
        />
        <KpiCard
          icon={AlertTriangle}
          label={t('dashboard.kpi.unassignedCount')}
          value={summary?.totals.unassigned ?? '—'}
          sub={
            summary && Number(summary.totals.unassignedHours ?? 0) > 0
              ? t('dashboard.kpi.unassignedHoursSub', {
                  hours: fmtHours(summary.totals.unassignedHours),
                })
              : undefined
          }
          tone={
            summary && summary.totals.unassigned > 0 ? 'warn' : 'ok'
          }
        />
      </div>

      {summary ? (
        <p className="text-xs text-zinc-500">
          {t('dashboard.kpiExtra', {
            items: summary.totals.items,
            invalid: summary.totals.invalid,
          })}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.category.title')}</CardTitle>
          </CardHeader>
          {!summary || summary.byCategory.length === 0 ? (
            <EmptyChart text={t('common.empty')} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    label={(p) =>
                      `${String(p.name)} · ${Math.round(Number(p.value ?? 0))}h`
                    }
                  >
                    {categoryChartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={CATEGORY_COLORS[entry.key] ?? '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => [
                      `${fmtHours(v)} h`,
                      'Hours',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.byType.title')}</CardTitle>
          </CardHeader>
          {!summary || summary.byType.length === 0 ? (
            <EmptyChart text={t('common.empty')} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeChartData}
                  margin={{ top: 10, right: 10, bottom: 24, left: 10 }}
                >
                  <XAxis
                    dataKey="type"
                    fontSize={11}
                    angle={-20}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(v: unknown) => [
                      `${fmtHours(v)} h`,
                      'Hours',
                    ]}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.recentAssignments.title')}
          </CardTitle>
        </CardHeader>
        <DataTable
          isLoading={recentLoading}
          empty={recent.length === 0 ? t('common.empty') : undefined}
        >
          <thead>
            <tr>
              <Th>{t('dashboard.recentAssignments.when')}</Th>
              <Th>{t('dashboard.recentAssignments.action')}</Th>
              <Th>{t('dashboard.recentAssignments.workload')}</Th>
              <Th>{t('dashboard.recentAssignments.hours')}</Th>
              <Th>{t('dashboard.recentAssignments.changes')}</Th>
              <Th>{t('dashboard.recentAssignments.by')}</Th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <Td className="whitespace-nowrap text-xs text-zinc-600">
                  {new Date(r.createdAt).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </Td>
                <Td>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-800">
                    {actionLabel[r.action as keyof typeof actionLabel] ??
                      r.action}
                  </span>
                </Td>
                <Td className="text-sm text-zinc-900">
                  <div className="font-medium">
                    {r.subjectName ?? '—'}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {t(`workloadType.${r.workloadType as WorkloadType}`)}
                    {r.subjectCode ? ` · ${r.subjectCode}` : ''}
                  </div>
                </Td>
                <Td className="text-right tabular-nums text-sm">
                  {fmtHours(r.plannedHours)}
                </Td>
                <Td className="text-xs text-zinc-700">
                  <span className="text-zinc-500">
                    {r.oldTeacherName ?? '—'}
                  </span>
                  <span className="mx-1">→</span>
                  <span className="font-medium">
                    {r.newTeacherName ?? '—'}
                  </span>
                </Td>
                <Td className="text-xs text-zinc-600">{r.performedByName}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.teacherLoad.title')}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <LegendDot color="#3b82f6" label={t('dashboard.teacherLoad.assigned')} />
            <LegendDot color="#d4d4d8" label={t('dashboard.teacherLoad.norm')} />
            <LegendDot color="#ef4444" label={t('dashboard.teacherLoad.over')} />
          </div>
        </CardHeader>
        {!summary || teacherChartData.length === 0 ? (
          <EmptyChart text={t('common.empty')} />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherChartData}
                margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
              >
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(v: unknown, _n, ctx) => {
                    const payload = ctx?.payload as { fullName?: string } | undefined;
                    return [
                      `${fmtHours(v)} h`,
                      payload?.fullName ?? '',
                    ];
                  }}
                />
                <Bar dataKey="assigned" radius={[4, 4, 0, 0]}>
                  {teacherChartData.map((d, idx) => (
                    <Cell
                      key={idx}
                      fill={d.over ? '#ef4444' : '#3b82f6'}
                    />
                  ))}
                </Bar>
                <ReferenceLine
                  y={summary.teachers[0]?.annualNorm ?? 0}
                  stroke="#d4d4d8"
                  strokeDasharray="4 2"
                  label={{
                    value: t('dashboard.teacherLoad.norm_line'),
                    position: 'right',
                    fontSize: 10,
                    fill: '#71717a',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {summary?.overNorm && summary.overNorm.length > 0 ? (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.overNorm.title', {
                count: summary.overNorm.length,
              })}
            </CardTitle>
          </CardHeader>
          <ul className="divide-y divide-red-200 text-sm">
            {summary.overNorm.map((tl) => (
              <li
                key={tl.id}
                className="flex items-center justify-between py-1.5 text-red-900"
              >
                <span className="flex items-center gap-1 font-medium">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {tl.fullName}
                  {tl.hasScientificDegree ? (
                    <Award
                      className="h-3 w-3 text-amber-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <span className="tabular-nums">
                  {fmtHours(tl.assignedHours)} / {fmtHours(tl.annualNorm, 0)}h ·{' '}
                  <span className="font-semibold">
                    +{fmtHours(tl.delta)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
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
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
        <Icon className="h-3 w-3" aria-hidden="true" />
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
      {sub ? (
        <div className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-xs text-zinc-400">
      {text}
    </div>
  );
}
