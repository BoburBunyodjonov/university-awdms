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
  ClipboardList,
  Layers,
  Users,
} from 'lucide-react';
import type { WorkloadType } from '@awdms/shared';
import { useAcademicYears } from '@/features/academic-years/api';
import { useMonitoringSummary } from '@/features/monitoring/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/page-loader';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  auditorium: '#3b82f6',
  non_auditorium: '#f59e0b',
};

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
      (summary?.teachers ?? []).slice(0, 12).map((tl) => ({
        name: tl.fullName.split(' ').slice(-1)[0] ?? tl.fullName,
        fullName: tl.fullName,
        assigned: Math.round(tl.assignedHours * 10) / 10,
        norm: tl.annualNorm,
        over: tl.delta > 0,
      })),
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

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          icon={ClipboardList}
          label={t('dashboard.kpi.items')}
          value={summary?.totals.items ?? '—'}
        />
        <KpiCard
          icon={Layers}
          label={t('dashboard.kpi.totalHours')}
          value={
            summary ? `${summary.totals.totalHours.toFixed(1)}h` : '—'
          }
        />
        <KpiCard
          icon={CheckCircle2}
          label={t('dashboard.kpi.assigned')}
          value={summary?.totals.assigned ?? '—'}
          tone={
            summary && summary.totals.unassigned === 0 ? 'ok' : 'neutral'
          }
        />
        <KpiCard
          icon={AlertTriangle}
          label={t('dashboard.kpi.unassigned')}
          value={summary?.totals.unassigned ?? '—'}
          tone={
            summary && summary.totals.unassigned > 0 ? 'warn' : 'ok'
          }
        />
      </div>

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
                    label={(p) => `${p.name} · ${Math.round(Number(p.value))}h`}
                  >
                    {categoryChartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={CATEGORY_COLORS[entry.key] ?? '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)} h`, 'Hours']}
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
                    formatter={(v: number) => [`${v.toFixed(1)} h`, 'Hours']}
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
                  formatter={(v: number, _n, { payload }) => [
                    `${v.toFixed(1)} h`,
                    (payload as { fullName: string }).fullName,
                  ]}
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
                  {tl.assignedHours.toFixed(1)} / {tl.annualNorm}h ·{' '}
                  <span className="font-semibold">+{tl.delta.toFixed(1)}</span>
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
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
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
