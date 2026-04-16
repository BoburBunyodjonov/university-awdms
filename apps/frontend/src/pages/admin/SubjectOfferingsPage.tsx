import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { AcademicTerm } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, Td, Th } from '@/components/ui/table';
import { useDirections } from '@/features/directions/api';
import {
  useDeleteSubjectOffering,
  useSubjectOfferings,
  type OfferingWithRelations,
  type SubjectOfferingsQuery,
} from '@/features/subject-offerings/api';
import { SubjectOfferingFormModal } from '@/features/subject-offerings/SubjectOfferingFormModal';

export function SubjectOfferingsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<SubjectOfferingsQuery>({
    page: 1,
    pageSize: 25,
    search: '',
  });
  const [editing, setEditing] = useState<OfferingWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useSubjectOfferings(query);
  const { data: directionsList } = useDirections();
  const deleteMut = useDeleteSubjectOffering();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (o: OfferingWithRelations) => {
    setEditing(o);
    setModalOpen(true);
  };
  const handleDelete = async (o: OfferingWithRelations) => {
    if (
      !confirm(
        t('offerings.confirm_delete', {
          name: o.subject.name,
          term: t(`academicTerm.${o.academicTerm}`),
        }),
      )
    )
      return;
    await deleteMut.mutateAsync(o.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.offerings')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('offerings.add')}</span>
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
              value={query.academicTerm}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  page: 1,
                  academicTerm: v as AcademicTerm | undefined,
                }))
              }
              placeholder={t('offerings.all_terms')}
              clearable
              options={[
                { value: 'fall', label: t('academicTerm.fall') },
                { value: 'spring', label: t('academicTerm.spring') },
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
                {data.total} {t('offerings.total_suffix')}
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
            <Th>{t('offerings.fields.subject')}</Th>
            <Th>{t('offerings.fields.direction')}</Th>
            <Th>{t('offerings.fields.placement')}</Th>
            <Th>{t('offerings.fields.groups')}</Th>
            <Th className="text-right">{t('offerings.fields.studentsTotal')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((o) => {
            const totalStudents = o.groupLinks.reduce(
              (n, l) => n + l.group.studentCount,
              0,
            );
            return (
              <tr key={o.id} className="hover:bg-zinc-50">
                <Td className="font-medium text-zinc-900">
                  {o.subject.name}
                  {o.subject.code ? (
                    <span className="ml-2 font-mono text-xs text-zinc-500">
                      {o.subject.code}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-zinc-700">
                  <span className="font-mono text-xs text-zinc-500">
                    {o.subject.direction.code}
                  </span>{' '}
                  {o.subject.direction.name}
                </Td>
                <Td className="text-xs text-zinc-700">
                  {t(`level.${o.subject.level}`)} /{' '}
                  {t(`studyType.${o.studyType}`)} · {t(`academicTerm.${o.academicTerm}`)}{' '}
                  · Y{o.courseYear}·S{o.semesterNumber}
                </Td>
                <Td>
                  {o.groupLinks.length === 0 ? (
                    <span className="text-xs text-zinc-400">
                      {t('offerings.no_groups')}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {o.groupLinks.map((l) => (
                        <span
                          key={l.groupId}
                          className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-700"
                        >
                          {l.group.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{totalStudents}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(o)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('common.edit')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(o)}
                      className="text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('common.delete')}</span>
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <SubjectOfferingFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        offering={editing}
      />
    </div>
  );
}
