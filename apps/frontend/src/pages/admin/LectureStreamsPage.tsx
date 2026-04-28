import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { Language, StreamStatus } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import { useDirections } from '@/features/directions/api';
import {
  useDeleteStream,
  useStreams,
  type StreamWithRelations,
  type StreamsQuery,
} from '@/features/lecture-streams/api';
import { LectureStreamFormModal } from '@/features/lecture-streams/LectureStreamFormModal';
import { cn } from '@/lib/utils';

export function LectureStreamsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<StreamsQuery>({
    page: 1,
    pageSize: 25,
  });
  const [editing, setEditing] = useState<StreamWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useStreams(query);
  const { data: directionsList } = useDirections();
  const deleteMut = useDeleteStream();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (s: StreamWithRelations) => {
    setEditing(s);
    setModalOpen(true);
  };
  const handleDelete = async (s: StreamWithRelations) => {
    if (
      !confirm(
        t('streams.confirm_delete', {
          name: s.name || s.subjectOffering.subject.name,
        }),
      )
    )
      return;
    await deleteMut.mutateAsync(s.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.streams')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('streams.add')}</span>
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        empty={data && data.items.length === 0 ? t('common.empty') : undefined}
        toolbar={
          <>
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
              options={[
                { value: 'uzbek', label: t('language.uzbek') },
                { value: 'russian', label: t('language.russian') },
              ]}
            />
            <Select
              className="w-36"
              value={query.status}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  page: 1,
                  status: v as StreamStatus | undefined,
                }))
              }
              placeholder={t('streams.all_statuses')}
              clearable
              options={[
                { value: 'draft', label: t('status.draft') },
                { value: 'ready', label: t('status.ready') },
                { value: 'assigned', label: t('status.assigned') },
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
                {data.total} {t('streams.total_suffix')}
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
            <Th>{t('streams.fields.name')}</Th>
            <Th>{t('streams.fields.subject')}</Th>
            <Th>{t('streams.fields.placement')}</Th>
            <Th>{t('streams.fields.language')}</Th>
            <Th>{t('streams.fields.groups')}</Th>
            <Th className="text-right">{t('streams.fields.students')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((s) => (
            <tr key={s.id} className="hover:bg-zinc-50">
              <Td className="font-medium text-zinc-900">
                {s.name || s.subjectOffering.subject.name}
              </Td>
              <Td className="font-medium text-zinc-900">
                {s.subjectOffering.subject.name}
                <div className="text-[10px] font-normal text-zinc-500">
                  {s.subjectOffering.subject.direction.code} ·{' '}
                  {t(`level.${s.subjectOffering.subject.level}`)}
                </div>
              </Td>
              <Td className="text-xs text-zinc-700">
                Y{s.subjectOffering.courseYear} · S
                {s.subjectOffering.semesterNumber}{' '}
                · {t(`academicTerm.${s.subjectOffering.academicTerm}`)}
                {' · '}
                {t(`studyType.${s.subjectOffering.studyType}`)}
              </Td>
              <Td>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                    s.language === 'uzbek'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-sky-200 bg-sky-50 text-sky-800',
                  )}
                >
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  {t(`language.${s.language}`)}
                </span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {s.groupLinks.map((l) => (
                    <span
                      key={l.groupId}
                      className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-700"
                    >
                      {l.group.name}
                    </span>
                  ))}
                </div>
              </Td>
              <Td className="text-right tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Users
                    className="h-3 w-3 text-zinc-400"
                    aria-hidden="true"
                  />
                  {s.totalStudentCount}
                </span>
              </Td>
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

      <LectureStreamFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stream={editing}
      />
    </div>
  );
}
