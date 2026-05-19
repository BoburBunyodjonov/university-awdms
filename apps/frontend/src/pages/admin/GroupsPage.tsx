import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Language } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import { useDirections } from '@/features/directions/api';
import {
  useDeleteGroup,
  useGroups,
  type GroupWithDirection,
  type GroupsQuery,
} from '@/features/groups/api';
import { GroupFormModal } from '@/features/groups/GroupFormModal';
import { LANGUAGES, languageBadgeClass } from '@/lib/language';
import { cn } from '@/lib/utils';

export function GroupsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<GroupsQuery>({
    page: 1,
    pageSize: 25,
    search: '',
  });
  const [editing, setEditing] = useState<GroupWithDirection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useGroups(query);
  const { data: directionsList } = useDirections();
  const deleteMut = useDeleteGroup();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (g: GroupWithDirection) => {
    setEditing(g);
    setModalOpen(true);
  };
  const handleDelete = async (g: GroupWithDirection) => {
    if (!confirm(t('groups.confirm_delete', { name: g.name }))) return;
    await deleteMut.mutateAsync(g.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.groups')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('groups.add')}</span>
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
                className="w-56 pl-7"
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
              value={query.language}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  page: 1,
                  language: v as Language | undefined,
                }))
              }
              placeholder={t('groups.all_languages')}
              clearable
              options={LANGUAGES.map((lang) => ({
                value: lang,
                label: t(`language.${lang}`),
              }))}
            />
            {isFetching ? (
              <span className="text-xs text-zinc-400">
                {t('common.loading')}
              </span>
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
                {data.total} {t('groups.total_suffix')}
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
            <Th>{t('groups.fields.name')}</Th>
            <Th>{t('groups.fields.direction')}</Th>
            <Th>{t('groups.fields.level_studyType')}</Th>
            <Th>{t('groups.fields.courseYear')}</Th>
            <Th>{t('groups.fields.semester')}</Th>
            <Th>{t('groups.fields.language')}</Th>
            <Th className="text-right">{t('groups.fields.studentCount')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((g) => (
            <tr key={g.id} className="hover:bg-zinc-50">
              <Td className="font-medium text-zinc-900">{g.name}</Td>
              <Td className="text-zinc-700">
                <span className="font-mono text-xs text-zinc-500">
                  {g.direction.code}
                </span>{' '}
                {g.direction.name}
              </Td>
              <Td className="text-zinc-700">
                {t(`level.${g.level}`)} / {t(`studyType.${g.studyType}`)}
              </Td>
              <Td className="tabular-nums">
                {g.courseYear}
              </Td>
              <Td className="text-zinc-700">
                #{g.semesterNumber} · {t(`academicTerm.${g.academicTerm}`)}
              </Td>
              <Td>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                    languageBadgeClass(g.language),
                  )}
                >
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  {t(`language.${g.language}`)}
                </span>
              </Td>
              <Td className="text-right tabular-nums">{g.studentCount}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(g)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(g)}
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

      <GroupFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        group={editing}
      />
    </div>
  );
}
