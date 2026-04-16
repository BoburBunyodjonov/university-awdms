import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  CheckCircle2,
  CircleSlash,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { Teacher } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, Td, Th } from '@/components/ui/table';
import {
  useDeleteTeacher,
  useTeachers,
  type TeachersQuery,
} from '@/features/teachers/api';
import { TeacherFormModal } from '@/features/teachers/TeacherFormModal';
import { cn } from '@/lib/utils';

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
            <Th>{t('teachers.fields.fullName')}</Th>
            <Th>{t('teachers.fields.position')}</Th>
            <Th>{t('teachers.fields.degreeName')}</Th>
            <Th className="text-right">{t('teachers.fields.annualNorm')}</Th>
            <Th>{t('teachers.fields.status')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((teacher) => (
            <tr key={teacher.id} className="hover:bg-zinc-50">
              <Td className="font-medium text-zinc-900">
                <div className="flex items-center gap-2">
                  <span>{teacher.fullName}</span>
                  {teacher.hasScientificDegree ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
                      title={t('teachers.fields.hasScientificDegree')}
                    >
                      <Award className="h-3 w-3" aria-hidden="true" />
                      {t('teachers.degree_badge')}
                    </span>
                  ) : null}
                </div>
              </Td>
              <Td>{teacher.position}</Td>
              <Td className="text-zinc-600">{teacher.degreeName}</Td>
              <Td className="text-right tabular-nums">{teacher.annualNorm}</Td>
              <Td>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs',
                    teacher.isActive ? 'text-emerald-700' : 'text-zinc-500',
                  )}
                >
                  {teacher.isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {teacher.isActive
                    ? t('teachers.status_active')
                    : t('teachers.status_inactive')}
                </span>
              </Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(teacher)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(teacher)}
                    aria-label={t('common.delete')}
                    className="text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.delete')}</span>
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
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
