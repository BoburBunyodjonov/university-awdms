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
    { name: 'Auditoriya', hours: Math.round(auditoriumH) },
    { name: 'Tashqari', hours: Math.round(nonH) },
    {
      name: 'Biriktirilmagan*',
      hours: Math.max(0, Math.round(department.totalDepartmentHours * 0.1)),
    },
  ];

  const pieData = [
    { name: 'Biriktirilgan', value: Math.round(totalAssigned), fill: '#4f46e5' },
    {
      name: 'Qolgan (kafedra)',
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
          Kafedra bosh sahifasi
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Soatlar, yuklama taqsimoti va so'nggi biriktirishlar umumiy ko'rinishi.
        </p>
      </div>

      <SummaryCards
        items={[
          {
            label: 'Kafedraning jami soatlari',
            value: `${department.totalDepartmentHours.toLocaleString()}`,
            hint: 'Yillik reja chegarasi',
            variant: 'indigo',
          },
          {
            label: 'Biriktirilgan soatlar',
            value: `${totalAssigned.toFixed(0)}`,
            hint: `Auditoriya ${auditoriumH.toFixed(0)} · Tashqari ${nonH.toFixed(0)}`,
            variant: 'emerald',
          },
          {
            label: 'Qolgan soatlar',
            value: `${Math.max(
              0,
              department.totalDepartmentHours - totalAssigned,
            ).toFixed(0)}`,
            hint: 'Kafedra − biriktirilgan',
            variant: 'amber',
          },
          {
            label: "O'qituvchilar / biriktirilmagan",
            value: `${teachers.length} / ${department.unassignedWorkloadCount}`,
            hint: 'Xodimlar va navbatda turgan ishlar',
            variant: 'default',
          },
        ]}
      />

      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Diqqat markazida</h2>
        <p className="text-xs text-zinc-500">
          O'qituvchi karta + tezkor yuklama tayinlash
        </p>
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
          <h2 className="text-sm font-semibold text-zinc-900">Yuklama tarkibi</h2>
          <p className="text-xs text-zinc-500">Soatlar qayerda to'plangan</p>
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
          <h2 className="text-sm font-semibold text-zinc-900">Foydalanish</h2>
          <p className="text-xs text-zinc-500">
            Biriktirilgan vs qolgan sig'im
          </p>
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
            * Biriktirilmagan segment — taxminiy navbatdagi ish.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Clock className="h-4 w-4" />
            So'nggi biriktirishlar
          </h2>
          <ul className="mt-4 space-y-2">
            {recent.length === 0 ? (
              <li className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center text-sm text-zinc-500">
                Hozircha biriktirish yo'q — o'qituvchi profilidan yoki kartadan yuklama
                qo'shing.
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
                    {r.hours.toFixed(1)} soat
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-dashed border-zinc-300 bg-indigo-50/30 p-6">
          <Workflow className="h-7 w-7 text-indigo-600" />
          <h3 className="mt-3 text-base font-semibold text-zinc-900">
            O'qituvchilar ro'yxatini ochish
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Profillar, filtrlar va formula ko'rsatkichli aqlli tayinlash oynasi.
          </p>
          <Link
            to="/teachers"
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 self-start rounded-lg',
              'bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white',
              'hover:bg-indigo-700',
            )}
          >
            O'qituvchilar sahifasiga
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
