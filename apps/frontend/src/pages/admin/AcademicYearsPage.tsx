import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { AcademicYear } from '@awdms/shared';
import { Button } from '@/components/ui/button';
import { DataTable, Td, Th } from '@/components/ui/table';
import {
  useAcademicYears,
  useDeleteAcademicYear,
  useSetActiveAcademicYear,
} from '@/features/academic-years/api';
import { AcademicYearFormModal } from '@/features/academic-years/AcademicYearFormModal';

function fmtDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

export function AcademicYearsPage() {
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: years, isLoading } = useAcademicYears();
  const deleteMut = useDeleteAcademicYear();
  const setActiveMut = useSetActiveAcademicYear();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    setModalOpen(true);
  };

  const handleDelete = async (y: AcademicYear) => {
    if (!confirm(t('academicYears.confirm_delete', { name: y.name }))) return;
    await deleteMut.mutateAsync(y.id).catch(() => {});
  };

  const handleSetActive = async (y: AcademicYear) => {
    if (y.isActive) return;
    await setActiveMut.mutateAsync(y.id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {t('nav.academic_years')}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('academicYears.add')}</span>
        </Button>
      </div>

      <p className="text-xs text-zinc-500">{t('academicYears.intro')}</p>

      <DataTable
        isLoading={isLoading}
        empty={
          years && years.length === 0 ? t('common.empty') : undefined
        }
      >
        <thead>
          <tr>
            <Th>{t('academicYears.fields.name')}</Th>
            <Th>{t('academicYears.fields.startDate')}</Th>
            <Th>{t('academicYears.fields.endDate')}</Th>
            <Th>{t('academicYears.fields.isActive')}</Th>
            <Th className="text-right">{t('common.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {years?.map((y) => (
            <tr key={y.id} className="hover:bg-zinc-50">
              <Td className="font-medium text-zinc-900">{y.name}</Td>
              <Td className="text-sm text-zinc-700">
                {fmtDate(y.startDate, i18n.language)}
              </Td>
              <Td className="text-sm text-zinc-700">
                {fmtDate(y.endDate, i18n.language)}
              </Td>
              <Td>
                {y.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    {t('academicYears.active_badge')}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">—</span>
                )}
              </Td>
              <Td>
                <div className="flex justify-end gap-1">
                  {!y.isActive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      title={t('academicYears.make_active')}
                      onClick={() => handleSetActive(y)}
                      loading={setActiveMut.isPending}
                    >
                      <Star className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(y)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(y)}
                    loading={deleteMut.isPending}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <AcademicYearFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        year={editing}
      />
    </div>
  );
}
