import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssignmentModal } from '@/components/AssignmentModal';
import type { Teacher } from '@/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Clock, Workflow } from 'lucide-react';
import { TeacherCard } from '@/components/TeacherCard';
import { PageLoading, SummaryCards } from '@/components/SummaryCards';
import { teacherStats, useWorkloadState, recentAssignments } from '@/state/WorkloadState';
import { cn } from '@/lib/cn';

export function DashboardPage() {
  const { assignments, teachers, department, setGlobalLoading } = useWorkloadState();
  const [loading, setLoading] = useState(true);
  const [assignTeacher, setAssignTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    setGlobalLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
      setGlobalLoading(false);
    }, 420);
    return () => clearTimeout(t);
  }, [setGlobalLoading]);

  const totalAssigned = assignments.reduce((s, a) => s + a.hours, 0);
  const auditoriumH = assignments
    .filter((a) => a.isAuditorium)
    .reduce((s, a) => s + a.hours, 0);
  const nonH = totalAssigned - auditoriumH;

  const barData = [
    { name: 'Auditorium', hours: Math.round(auditoriumH) },
    { name: 'Non-auditorium', hours: Math.round(nonH) },
    { name: 'Unassigned*', hours: Math.max(0, Math.round(department.totalDepartmentHours * 0.1)) },
  ];

  const pieData = [
    { name: 'Assigned', value: Math.round(totalAssigned), fill: '#4f46e5' },
    {
      name: 'Remaining (dept cap)',
      value: Math.max(0, department.totalDepartmentHours - totalAssigned),
      fill: '#d4d4d8',
    },
  ];

  const recent = recentAssignments(assignments, teachers);
  const spotlight = teachers.slice(0, 3);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Department dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live overview of hours, load distribution, and recent assignments.
        </p>
      </div>

      <SummaryCards
        items={[
          {
            label: 'Total department hours (cap)',
            value: `${department.totalDepartmentHours.toLocaleString()}h`,
            hint: 'Year planning ceiling',
            variant: 'indigo',
          },
          {
            label: 'Assigned hours (mock data)',
            value: `${totalAssigned.toFixed(0)}h`,
            hint: `Auditorium ${auditoriumH.toFixed(0)}h · Non ${nonH.toFixed(0)}h`,
            variant: 'emerald',
          },
          {
            label: 'Remaining (dept - assigned)',
            value: `${Math.max(0, department.totalDepartmentHours - totalAssigned).toFixed(0)}h`,
            variant: 'amber',
          },
          {
            label: 'Teachers / Unassigned items',
            value: `${teachers.length} / ${department.unassignedWorkloadCount}`,
            hint: 'Headcount & queue',
            variant: 'default',
          },
        ]}
      />

      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Spotlight</h2>
        <p className="text-xs text-zinc-500">Reusable TeacherCard + quick assign</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {spotlight.map((t) => {
            const s = teacherStats(t.id, assignments);
            const rem = t.annualNorm - s.total;
            return (
              <TeacherCard
                key={t.id}
                id={t.id}
                name={t.name}
                degree={t.degree}
                totalHours={s.total}
                remainingNorm={rem}
                onAssign={() => setAssignTeacher(t)}
                compact
              />
            );
          })}
        </div>
      </div>

      {assignTeacher ? (
        <AssignmentModal
          open
          teacher={assignTeacher}
          onClose={() => setAssignTeacher(null)}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-zinc-900">Load mix</h2>
          <p className="text-xs text-zinc-500">Where hours sit today</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7' }}
                />
                <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-zinc-900">Utilization</h2>
          <p className="text-xs text-zinc-500">Assigned vs remaining capacity</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-zinc-500">
            * Unassigned bar segment is illustrative queue work.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Clock className="h-4 w-4" />
            Recent assignments
          </h2>
          <ul className="mt-4 space-y-2">
            {recent.length === 0 ? (
              <li className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center text-sm text-zinc-500">
                No assignments yet — add workload from a teacher profile or spotlight
                cards.
              </li>
            ) : (
              recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{r.label}</p>
                    <p className="text-xs text-zinc-500">
                      {r.teacherName} · {r.subject}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-medium text-zinc-800">
                    {r.hours.toFixed(1)}h
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-dashed border-zinc-300 bg-indigo-50/30 p-6">
          <Workflow className="h-7 w-7 text-indigo-600" />
          <h3 className="mt-3 text-base font-semibold text-zinc-900">
            Open teacher roster
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            View profiles, filters, and the smart assignment modal with formula preview.
          </p>
          <Link
            to="/teachers"
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 self-start rounded-lg',
              'bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white',
              'hover:bg-zinc-800',
            )}
          >
            Go to teachers
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
