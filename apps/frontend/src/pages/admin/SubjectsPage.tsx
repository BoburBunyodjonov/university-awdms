import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { StudyLevel } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import { useDirections } from '@/features/directions/api';
import {
  useDeleteSubject,
  useSubjects,
  type SubjectWithRelations,
  type SubjectsQuery,
} from '@/features/subjects/api';
import { SubjectFormModal } from '@/features/subjects/SubjectFormModal';

export function SubjectsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<SubjectsQuery>({
    page: 1,
    pageSize: 25,
    search: '',
  });
  const [editing, setEditing] = useState<SubjectWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useSubjects(query);
  const { data: directionsList } = useDirections();
  const deleteMut = useDeleteSubject();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (s: SubjectWithRelations) => {
    setEditing(s);
    setModalOpen(true);
  };
  const handleDelete = async (s: SubjectWithRelations) => {
    if (!confirm(t('subjects.confirm_delete', { name: s.name }))) return;
    await deleteMut.mutateAsync(s.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.subjects')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('subjects.add')}</span>
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        empty={data && data.items.length === 0 ? t('common.empty') : undefined}
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
            <Select
              className="w-52"
              value={query.directionId}
              onValueChange={(v) =>
                setQuery((q) => ({ ...q, page: 1, directionId: v }))
              }
              placeholder={t('groups.all_directions')}
              clearable
              options={
                directionsList?.items.map((d) => ({
                  value: d.id,
                  label: `${d.code} — ${d.name}`,
                })) ?? []
              }
            />
            <Select
              className="w-36"
              value={query.level}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  page: 1,
                  level: v as StudyLevel | undefined,
                }))
              }
              placeholder={t('directions.all_levels')}
              clearable
              options={[
                { value: 'bachelor', label: t('level.bachelor') },
                { value: 'master', label: t('level.master') },
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
                {data.total} {t('subjects.total_suffix')}
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
            <Th>{t('subjects.fields.name')}</Th>
            <Th>{t('subjects.fields.direction')}</Th>
            <Th>{t('subjects.fields.level')}</Th>
            <Th className="text-right">{t('subjects.fields.offerings')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((s) => (
            <tr key={s.id} className="hover:bg-zinc-50">
              <Td className="font-medium text-zinc-900">{s.name}</Td>
              <Td className="text-zinc-700">
                <span className="font-mono text-xs text-zinc-500">
                  {s.direction.code}
                </span>{' '}
                {s.direction.name}
              </Td>
              <Td>
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700">
                  {t(`level.${s.level}`)}
                </span>
              </Td>
              <Td className="text-right tabular-nums">{s._count.offerings}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(s)}
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

      <SubjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        subject={editing}
      />
    </div>
  );
}
