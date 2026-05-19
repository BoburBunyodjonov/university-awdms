import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Languages, Users } from 'lucide-react';
import {
  CreateLectureStreamSchema,
  type CreateLectureStreamInput,
  type Language,
} from '@awdms/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Field } from '@/components/ui/field';
import { useDirections } from '@/features/directions/api';
import { useSubjectOfferings } from '@/features/subject-offerings/api';
import { api } from '@/lib/api';
import { LIST_PAGE_SIZE_MAX } from '@/lib/pagination';
import { useQuery } from '@tanstack/react-query';
import {
  useCreateStreams,
  useUpdateStream,
  type StreamWithRelations,
} from './api';
import { languageBadgeClass } from '@/lib/language';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  stream?: StreamWithRelations | null;
}

const DEFAULTS: CreateLectureStreamInput = {
  name: '',
  subjectOfferingId: '',
  language: 'uzbek',
  groupIds: [],
  teacherId: null,
  status: 'draft',
};

// When the user selects a subject offering we need the groups linked to that
// offering. We hit GET /subject-offerings/:id for that — the response already
// includes groupLinks[].group with language, studentCount, courseYear.
interface OfferingGroupLink {
  groupId: string;
  group: {
    id: string;
    name: string;
    language: Language;
    studentCount: number;
    courseYear: number;
  };
}

interface OfferingDetail {
  id: string;
  subject: {
    name: string;
    code: string | null;
    level: string;
    lectureCoefficient: number;
    controlCoefficient: number;
    practiceCoefficient: number;
  };
  groupLinks: OfferingGroupLink[];
}

export function LectureStreamFormModal({ open, onClose, stream }: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(stream);
  const createManyMut = useCreateStreams();
  const updateMut = useUpdateStream(stream?.id ?? '');
  const [selectedDirectionIds, setSelectedDirectionIds] = useState<string[]>([]);
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const { data: directionsList } = useDirections();

  const { data: offeringsList } = useSubjectOfferings({
    page: 1,
    pageSize: LIST_PAGE_SIZE_MAX,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateLectureStreamInput>({
    resolver: zodResolver(CreateLectureStreamSchema),
    defaultValues: DEFAULTS,
  });

  const offeringId = useWatch({ control, name: 'subjectOfferingId' });
  const streamName = useWatch({ control, name: 'name' });
  const language = useWatch({ control, name: 'language' });
  const selectedGroupIds = useWatch({ control, name: 'groupIds' }) ?? [];

  // Pull the offering detail once the user picks one. Includes the full set
  // of candidate groups — no separate /groups call needed.
  const { data: offeringDetail } = useQuery<OfferingDetail>({
    enabled: Boolean(offeringId),
    queryKey: ['offering-detail', offeringId],
    queryFn: async () => {
      const { data } = await api.get<OfferingDetail>(
        `/subject-offerings/${offeringId}`,
      );
      return data;
    },
  });

  const candidateGroups = offeringDetail?.groupLinks.map((l) => l.group) ?? [];

  const availableOfferings = useMemo(() => {
    const items = offeringsList?.items ?? [];
    if (!selectedDirectionIds.length) return items;
    return items.filter((o) =>
      selectedDirectionIds.includes(o.subject.directionId),
    );
  }, [offeringsList, selectedDirectionIds]);

  const selectedOfferings = useMemo(
    () => availableOfferings.filter((o) => selectedOfferingIds.includes(o.id)),
    [availableOfferings, selectedOfferingIds],
  );

  const availableGroups = useMemo(() => {
    const byId = new Map<string, OfferingGroupLink['group']>();
    for (const offering of selectedOfferings) {
      for (const link of offering.groupLinks) {
        byId.set(link.group.id, link.group);
      }
    }
    return [...byId.values()];
  }, [selectedOfferings]);
  const selectableGroups = isEditing ? candidateGroups : availableGroups;

  // The first group picked locks the language. Any subsequent group with a
  // different language is shown but disabled — so the user understands *why*
  // they can't pick it.
  const firstPickedLanguage: Language | null = useMemo(() => {
    if (!selectedGroupIds.length) return null;
    const first = selectableGroups.find((g) =>
      selectedGroupIds.includes(g.id),
    );
    return first?.language ?? null;
  }, [selectedGroupIds, selectableGroups]);

  // Sync the form's `language` field to whichever the first group has.
  useEffect(() => {
    if (firstPickedLanguage && firstPickedLanguage !== language) {
      setValue('language', firstPickedLanguage, { shouldValidate: false });
    }
  }, [firstPickedLanguage, language, setValue]);

  const totalStudents = useMemo(
    () =>
      selectableGroups
        .filter((g) => selectedGroupIds.includes(g.id))
        .reduce((n, g) => n + g.studentCount, 0),
    [selectableGroups, selectedGroupIds],
  );

  useEffect(() => {
    if (open) {
      reset(
        stream
          ? {
              name: stream.name,
              subjectOfferingId: stream.subjectOffering.id,
              language: stream.language,
              groupIds: stream.groupLinks.map((l) => l.groupId),
              teacherId: stream.teacher?.id ?? null,
              status: stream.status,
            }
          : DEFAULTS,
      );
      setSelectedDirectionIds(
        stream ? [stream.subjectOffering.subject.directionId] : [],
      );
      setSelectedOfferingIds(stream ? [stream.subjectOffering.id] : []);
      if (!stream) {
        setValue('groupIds', [], { shouldDirty: false });
      }
      setCreateError(null);
    }
  }, [open, stream, reset, setValue]);

  // Switching the offering invalidates the current group selection, since
  // groups are offering-scoped.
  useEffect(() => {
    if (!isEditing && offeringId) {
      setValue('groupIds', [], { shouldDirty: true });
    }
  }, [offeringId, isEditing, setValue]);

  const toggleGroup = (groupId: string, disabled: boolean) => {
    if (disabled) return;
    const next = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id) => id !== groupId)
      : [...selectedGroupIds, groupId];
    setValue('groupIds', next, { shouldDirty: true });
  };

  const handleDirectionChange = (next: string[]) => {
    setSelectedDirectionIds(next);
    setSelectedOfferingIds((offeringIds) => {
      const filtered = offeringIds.filter((offeringId) => {
        const offering = offeringsList?.items.find((o) => o.id === offeringId);
        return offering ? next.includes(offering.subject.directionId) : false;
      });
      if (isEditing && !filtered.length) {
        setValue('subjectOfferingId', '', { shouldDirty: true });
      }
      return filtered;
    });
    setValue('groupIds', [], { shouldDirty: true });
  };

  const handleOfferingChange = (next: string[]) => {
    const selected = isEditing ? next.slice(-1) : next;
    setSelectedOfferingIds(selected);
    if (isEditing) {
      setValue('subjectOfferingId', selected[0] ?? '', { shouldDirty: true });
    }
    setValue('groupIds', [], { shouldDirty: true });
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = streamName?.trim() ?? '';
    if (!name) {
      setCreateError(t('streams.validation.name_required'));
      return;
    }
    if (!selectedDirectionIds.length) {
      setCreateError(t('streams.validation.directions_required'));
      return;
    }
    if (!selectedOfferings.length) {
      setCreateError(t('streams.validation.subjects_required'));
      return;
    }
    if (!selectedGroupIds.length) {
      setCreateError(t('streams.validation.groups_required'));
      return;
    }

    const offeringsWithoutGroups: string[] = [];
    const inputs = selectedOfferings.flatMap((offering) => {
      const linkedSelectedGroups = offering.groupLinks.filter((link) =>
        selectedGroupIds.includes(link.groupId),
      );
      if (!linkedSelectedGroups.length) {
        offeringsWithoutGroups.push(offering.subject.name);
        return [];
      }
      const groupsByLanguage = linkedSelectedGroups.reduce<
        Record<Language, string[]>
      >(
        (acc, link) => {
          acc[link.group.language].push(link.groupId);
          return acc;
        },
        { uzbek: [], russian: [], eng: [] },
      );
      return (Object.entries(groupsByLanguage) as [Language, string[]][])
        .filter(([, groupIds]) => groupIds.length > 0)
        .map(([language, groupIds]) => ({
          name,
          subjectOfferingId: offering.id,
          language,
          groupIds,
          teacherId: null,
          status: 'draft' as const,
        }));
    });

    if (offeringsWithoutGroups.length) {
      setCreateError(t('streams.validation.groups_match_required'));
      return;
    }

    setCreateError(null);
    try {
      await createManyMut.mutateAsync(inputs);
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  const onSubmit = async (values: CreateLectureStreamInput) => {
    try {
      if (isEditing) {
        await updateMut.mutateAsync({
          name: values.name,
          subjectOfferingId: values.subjectOfferingId,
          language: values.language,
          groupIds: values.groupIds,
        });
      }
      onClose();
    } catch {
      /* hook toasts the error; keep modal open */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('streams.edit_title') : t('streams.add_title')}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="stream-form"
            loading={
              isEditing ? updateMut.isPending : createManyMut.isPending
            }
          >
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="stream-form"
        className="space-y-4"
        onSubmit={isEditing ? handleSubmit(onSubmit) : handleCreateSubmit}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('streams.fields.name')} error={errors.name?.message}>
            <Input
              autoFocus
              placeholder={t('streams.name_placeholder')}
              {...register('name')}
            />
          </Field>

        </div>

        <div className="grid grid-cols-2 gap-3">
            <Field label={t('streams.fields.directions')}>
              <MultiSelect
                value={selectedDirectionIds}
                onValueChange={handleDirectionChange}
                placeholder={t('streams.pick_directions')}
                options={
                  directionsList?.items.map((direction) => ({
                    value: direction.id,
                    label: direction.name,
                    description: direction.code,
                  })) ?? []
                }
              />
            </Field>

            <Field label={t('streams.fields.subjects')}>
              <MultiSelect
                value={selectedOfferingIds}
                onValueChange={handleOfferingChange}
                disabled={!selectedDirectionIds.length}
                aria-label={t('streams.fields.subjects')}
                placeholder={t('streams.pick_subjects')}
                emptyContent={
                  selectedDirectionIds.length
                    ? t('streams.no_subjects')
                    : t('streams.pick_direction_first')
                }
                options={availableOfferings.map((offering) => ({
                  value: offering.id,
                  label: offering.subject.name,
                  description: `${offering.subject.direction.code} · Y${offering.courseYear} · S${offering.semesterNumber} · ${t(`academicTerm.${offering.academicTerm}`)} · ${offering.groupLinks.length} ${t('offerings.fields.groups')}`,
                }))}
              />
            </Field>

        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium text-zinc-700">
              {t('streams.fields.groups')}
            </span>
            <div className="flex items-center gap-3 text-xs text-zinc-600">
              {firstPickedLanguage ? (
                <span className="inline-flex items-center gap-1">
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {t('streams.locked_language', {
                      lang: t(`language.${firstPickedLanguage}`),
                    })}
                  </span>
                </span>
              ) : (
                <span className="text-zinc-500">
                  {t('streams.pick_first_hint')}
                </span>
              )}
            </div>
          </div>

          {isEditing && !offeringId ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('streams.pick_offering_first')}
            </div>
          ) : !isEditing && !selectedOfferingIds.length ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('streams.pick_subject_first')}
            </div>
          ) : !selectableGroups.length ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
              {t('streams.no_groups')}
            </div>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border border-zinc-200 bg-white">
              <ul className="divide-y divide-zinc-100">
                {selectableGroups.map((g) => {
                  const checked = selectedGroupIds.includes(g.id);
                  const disabled =
                    firstPickedLanguage !== null &&
                    g.language !== firstPickedLanguage &&
                    !checked;
                  return (
                    <li key={g.id}>
                      <label
                        className={cn(
                          'flex items-center justify-between gap-2 px-3 py-1.5 text-sm',
                          disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer',
                          checked ? 'bg-blue-50' : 'hover:bg-zinc-50',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleGroup(g.id, disabled)}
                          />
                          <span className="font-medium text-zinc-900">
                            {g.name}
                          </span>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-1.5 py-0.5 text-[10px]',
                              languageBadgeClass(g.language),
                            )}
                          >
                            {t(`language.${g.language}`)}
                          </span>
                          {disabled ? (
                            <span className="text-[10px] text-red-600">
                              {t('streams.different_language')}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-zinc-500">
                          Y{g.courseYear} · {g.studentCount}{' '}
                          {t('offerings.students_short')}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {errors.groupIds ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.groupIds.message as string}
            </p>
          ) : null}

          {selectedGroupIds.length > 0 ? (
            <div className="mt-2 flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm">
              <span className="inline-flex items-center gap-1.5 text-zinc-700">
                <Users className="h-4 w-4" aria-hidden="true" />
                {t('streams.total_students', { count: totalStudents })}
              </span>
              <span className="text-xs text-zinc-500">
                {t('streams.group_count', { count: selectedGroupIds.length })}
              </span>
            </div>
          ) : null}
        </div>

        {createError ? (
          <p className="text-xs text-red-600" role="alert">
            {createError}
          </p>
        ) : null}

        <input type="hidden" {...register('language')} />

      </form>
    </Dialog>
  );
}
