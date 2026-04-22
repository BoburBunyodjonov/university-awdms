import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { Teacher } from '@awdms/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, Td, Th } from '@/components/ui/table';
import {
  useDeleteTeacher,
  useTeachers,
  type TeachersQuery,
} from '@/features/teachers/api';
import { TeacherFormModal } from '@/features/teachers/TeacherFormModal';
import { cn } from '@/lib/utils';

function teacherTotalHours(t: Teacher): number {
  return (t.auditoriumHours ?? 0) + (t.nonAuditoriumHours ?? 0);
}

function remainingNormHours(t: Teacher): { value: number; overBy: number } {
  const total = teacherTotalHours(t);
  const over = Math.max(0, total - t.annualNorm);
  const value = Math.max(0, t.annualNorm - total);
  return { value, overBy: over };
}

export function TeachersPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<TeachersQuery>({
    page: 1,
    pageSize: 25,
    search: '',
  });
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useTeachers(query);
  const deleteMut = useDeleteTeacher();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setModalOpen(true);
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(t('teachers.confirm_delete', { name: teacher.fullName }))) return;
    await deleteMut.mutateAsync(teacher.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.teachers')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('teachers.add')}</span>
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        empty={
          data && data.items.length === 0 ? t('common.empty') : undefined
        }
        toolbar={
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
              />
              <Input
                className="w-64 pl-7"
                placeholder={t('common.search')}
                value={query.search ?? ''}
                onChange={(e) =>
                  setQuery((q) => ({ ...q, page: 1, search: e.target.value }))
                }
              />
            </div>
            {isFetching ? (
              <span className="text-xs text-zinc-400">{t('common.loading')}</span>
            ) : null}
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
                {data.total} {t('teachers.total_suffix')}
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
            <Th>{t('teachers.list.col_name')}</Th>
            <Th>{t('teachers.list.col_degree')}</Th>
            <Th className="text-right">{t('teachers.list.col_total_hours')}</Th>
            <Th className="text-right">
              {t('teachers.fields.auditoriumHoursCol')}
            </Th>
            <Th className="text-right">
              {t('teachers.fields.nonAuditoriumHoursCol')}
            </Th>
            <Th className="text-right">{t('teachers.list.col_remaining_norm')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((teacher) => {
            const total = teacherTotalHours(teacher);
            const { value: rem, overBy } = remainingNormHours(teacher);
            return (
              <tr
                key={teacher.id}
                className={cn(
                  'hover:bg-zinc-50',
                  !teacher.isActive && 'opacity-60',
                )}
              >
                <Td className="font-medium text-zinc-900">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      to={`/admin/teachers/${teacher.id}`}
                      className="text-zinc-900 hover:underline"
                    >
                      {teacher.fullName}
                    </Link>
                    {!teacher.isActive ? (
                      <span className="text-[10px] font-normal text-zinc-500">
                        {t('teachers.status_inactive')}
                      </span>
                    ) : null}
                  </div>
                </Td>
                <Td className="text-sm text-zinc-800">
                  {teacher.hasScientificDegree
                    ? t('teachers.list.degree_phd')
                    : t('teachers.list.degree_no')}
                </Td>
                <Td className="text-right tabular-nums text-zinc-900">
                  {total.toFixed(1)}
                </Td>
                <Td className="text-right tabular-nums text-zinc-800">
                  {(teacher.auditoriumHours ?? 0).toFixed(1)}
                </Td>
                <Td className="text-right tabular-nums text-zinc-800">
                  {(teacher.nonAuditoriumHours ?? 0).toFixed(1)}
                </Td>
                <Td className="text-right text-sm">
                  <span className="tabular-nums font-medium text-zinc-900">
                    {rem.toFixed(1)}h
                  </span>
                  {overBy > 0 ? (
                    <span className="ml-1.5 text-xs text-red-600">
                      {t('teachers.list.over_norm', { hours: overBy.toFixed(1) })}
                    </span>
                  ) : null}
                </Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link
                      to={`/admin/workload?assignedTeacherId=${teacher.id}`}
                      className={cn(
                        buttonVariants({ variant: 'primary', size: 'sm' }),
                        'no-underline',
                      )}
                    >
                      <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('teachers.list.assign_workload')}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(teacher)}
                      aria-label={t('common.edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(teacher)}
                      aria-label={t('common.delete')}
                      className="text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <TeacherFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        teacher={editing}
      />
    </div>
  );
}
