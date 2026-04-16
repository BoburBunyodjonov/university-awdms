import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { StudyLevel } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import {
  useDeleteDirection,
  useDirections,
  type DirectionWithCounts,
  type DirectionsQuery,
} from '@/features/directions/api';
import { DirectionFormModal } from '@/features/directions/DirectionFormModal';

export function DirectionsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<DirectionsQuery>({ search: '' });
  const [editing, setEditing] = useState<DirectionWithCounts | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useDirections(query);
  const deleteMut = useDeleteDirection();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (direction: DirectionWithCounts) => {
    setEditing(direction);
    setModalOpen(true);
  };

  const handleDelete = async (d: DirectionWithCounts) => {
    if (!confirm(t('directions.confirm_delete', { name: d.name }))) return;
    await deleteMut.mutateAsync(d.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.directions')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('directions.add')}</span>
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
                  setQuery((q) => ({ ...q, search: e.target.value }))
                }
              />
            </div>
            <Select
              className="w-40"
              value={query.level}
              onValueChange={(v) =>
                setQuery((q) => ({ ...q, level: v as StudyLevel | undefined }))
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
            <span>
              {data.total} {t('directions.total_suffix')}
            </span>
          ) : null
        }
      >
        <thead>
          <tr>
            <Th>{t('directions.fields.code')}</Th>
            <Th>{t('directions.fields.name')}</Th>
            <Th>{t('directions.fields.level')}</Th>
            <Th className="text-right">{t('directions.fields.groups')}</Th>
            <Th className="text-right">{t('directions.fields.subjects')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((d) => (
            <tr key={d.id} className="hover:bg-zinc-50">
              <Td className="font-mono text-xs text-zinc-700">{d.code}</Td>
              <Td className="font-medium text-zinc-900">{d.name}</Td>
              <Td>
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700">
                  {t(`level.${d.level}`)}
                </span>
              </Td>
              <Td className="text-right tabular-nums">{d._count.groups}</Td>
              <Td className="text-right tabular-nums">{d._count.subjects}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(d)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(d)}
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

      <DirectionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        direction={editing}
      />
    </div>
  );
}
