import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { FormulaConfig, Prisma } from '@prisma/client';
import {
  categoryOf,
  requiresScientificDegree,
  type FormulaScope,
  type WorkloadType,
} from '@awdms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateFormula } from './formula-engine';
import type {
  AssignWorkloadDto,
  CreateWorkloadItemDto,
  GenerateWorkloadDto,
  ReassignWorkloadDto,
  UnassignWorkloadDto,
  UpdateWorkloadItemDto,
  WorkloadQueryDto,
} from './dto/workload-item.dto';

const include = {
  academicYear: { select: { id: true, name: true, isActive: true } },
  subjectOffering: {
    select: {
      id: true,
      academicTerm: true,
      courseYear: true,
      semesterNumber: true,
      studyType: true,
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
          direction: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
  lectureStream: {
    select: { id: true, language: true, totalStudentCount: true, status: true },
  },
  group: {
    select: { id: true, name: true, language: true, studentCount: true },
  },
  assignedTeacher: {
    select: {
      id: true,
      fullName: true,
      hasScientificDegree: true,
      position: true,
      annualNorm: true,
    },
  },
  formulaConfig: {
    select: {
      id: true,
      name: true,
      calculationMode: true,
      scopeType: true,
    },
  },
} satisfies Prisma.WorkloadItemInclude;

@Injectable()
export class WorkloadService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: WorkloadQueryDto) {
    const where: Prisma.WorkloadItemWhereInput = {
      ...(q.academicYearId ? { academicYearId: q.academicYearId } : {}),
      ...(q.subjectOfferingId
        ? { subjectOfferingId: q.subjectOfferingId }
        : {}),
      ...(q.lectureStreamId ? { lectureStreamId: q.lectureStreamId } : {}),
      ...(q.groupId ? { groupId: q.groupId } : {}),
      ...(q.assignedTeacherId
        ? { assignedTeacherId: q.assignedTeacherId }
        : {}),
      ...(q.workloadType ? { workloadType: q.workloadType } : {}),
      ...(q.category ? { category: q.category } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.unassignedOnly ? { assignedTeacherId: null } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workloadItem.findMany({
        where,
        include,
        orderBy: [
          { status: 'asc' },
          { workloadType: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.workloadItem.count({ where }),
    ]);
    return {
      items,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.workloadItem.findUnique({
      where: { id },
      include,
    });
    if (!item) throw new NotFoundException(`Workload item ${id} not found`);
    return item;
  }

  async create(dto: CreateWorkloadItemDto) {
    const context = await this.resolveContext(dto);
    const plannedHours = await this.computePlannedHours({
      workloadType: dto.workloadType,
      studentCount: context.studentCount,
      level: context.level,
      studyType: context.studyType,
      formulaConfigId: dto.formulaConfigId ?? null,
    });

    return this.prisma.workloadItem.create({
      data: {
        academicYearId: dto.academicYearId,
        subjectOfferingId: dto.subjectOfferingId ?? null,
        lectureStreamId: dto.lectureStreamId ?? null,
        groupId: dto.groupId ?? null,
        workloadType: dto.workloadType,
        category: categoryOf(dto.workloadType as WorkloadType),
        studentCount: context.studentCount,
        plannedHours: plannedHours.hours,
        formulaConfigId: plannedHours.formulaId,
        requiresDegree: requiresScientificDegree(
          dto.workloadType as WorkloadType,
        ),
        status: 'unassigned',
      },
      include,
    });
  }

  async update(id: string, dto: UpdateWorkloadItemDto) {
    const current = await this.findOne(id);
    const newStudents = dto.studentCount ?? current.studentCount;
    const newFormulaId =
      dto.formulaConfigId !== undefined
        ? dto.formulaConfigId
        : current.formulaConfigId;
    const recompute =
      dto.studentCount !== undefined || dto.formulaConfigId !== undefined;

    let plannedHours = dto.plannedHours ?? current.plannedHours;
    if (recompute && dto.plannedHours === undefined) {
      const level =
        current.subjectOffering?.subject.level ?? 'bachelor';
      const studyType =
        current.subjectOffering?.studyType ?? 'full_time';
      const result = await this.computePlannedHours({
        workloadType: current.workloadType as WorkloadType,
        studentCount: newStudents,
        level,
        studyType,
        formulaConfigId: newFormulaId,
      });
      plannedHours = result.hours;
    }

    return this.prisma.workloadItem.update({
      where: { id },
      data: {
        studentCount: dto.studentCount,
        plannedHours,
        formulaConfigId: dto.formulaConfigId,
        requiresDegree: dto.requiresDegree,
        status: dto.status,
      },
      include,
    });
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.assignmentLog.deleteMany({ where: { workloadItemId: id } });
      return tx.workloadItem.delete({ where: { id: item.id } });
    });
  }

  /**
   * §4.7 — generate workload items from subject offerings.
   *   lecture + control per lecture stream (student count = stream total)
   *   practice per group that's linked to a stream (student count = group)
   *
   * Idempotent: skips combinations that already exist.
   */
  async generate(dto: GenerateWorkloadDto) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!year) {
      throw new BadRequestException(
        `Academic year ${dto.academicYearId} not found`,
      );
    }

    const offerings = await this.prisma.subjectOffering.findMany({
      where: dto.subjectOfferingIds
        ? { id: { in: dto.subjectOfferingIds } }
        : { isActive: true },
      include: {
        subject: {
          select: { id: true, name: true, level: true, directionId: true },
        },
        lectureStreams: {
          include: {
            groupLinks: { select: { groupId: true } },
          },
        },
        groupLinks: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                studentCount: true,
                language: true,
              },
            },
          },
        },
      },
    });

    const createdItems: string[] = [];
    const skipped: string[] = [];

    for (const offering of offerings) {
      const level = offering.subject.level;
      const studyType = offering.studyType;

      // lecture + control per stream
      for (const stream of offering.lectureStreams) {
        for (const wtype of ['lecture', 'control'] as const) {
          const existing = await this.prisma.workloadItem.findFirst({
            where: {
              academicYearId: year.id,
              lectureStreamId: stream.id,
              workloadType: wtype,
              groupId: null,
            },
            select: { id: true },
          });
          if (existing) {
            skipped.push(existing.id);
            continue;
          }
          const planned = await this.computePlannedHours({
            workloadType: wtype,
            studentCount: stream.totalStudentCount,
            level,
            studyType,
            formulaConfigId: null,
          });
          const created = await this.prisma.workloadItem.create({
            data: {
              academicYearId: year.id,
              subjectOfferingId: offering.id,
              lectureStreamId: stream.id,
              workloadType: wtype,
              category: categoryOf(wtype),
              studentCount: stream.totalStudentCount,
              plannedHours: planned.hours,
              formulaConfigId: planned.formulaId,
              requiresDegree: requiresScientificDegree(wtype),
              status: 'unassigned',
            },
            select: { id: true },
          });
          createdItems.push(created.id);
        }
      }

      // practice per group (if the group is in a stream)
      const groupToStream = new Map<string, string>();
      for (const stream of offering.lectureStreams) {
        for (const gl of stream.groupLinks) {
          groupToStream.set(gl.groupId, stream.id);
        }
      }

      for (const gl of offering.groupLinks) {
        const streamId = groupToStream.get(gl.groupId);
        if (!streamId) continue;
        const existing = await this.prisma.workloadItem.findFirst({
          where: {
            academicYearId: year.id,
            lectureStreamId: streamId,
            groupId: gl.groupId,
            workloadType: 'practice',
          },
          select: { id: true },
        });
        if (existing) {
          skipped.push(existing.id);
          continue;
        }
        const planned = await this.computePlannedHours({
          workloadType: 'practice',
          studentCount: gl.group.studentCount,
          level,
          studyType,
          formulaConfigId: null,
        });
        const created = await this.prisma.workloadItem.create({
          data: {
            academicYearId: year.id,
            subjectOfferingId: offering.id,
            lectureStreamId: streamId,
            groupId: gl.groupId,
            workloadType: 'practice',
            category: 'auditorium',
            studentCount: gl.group.studentCount,
            plannedHours: planned.hours,
            formulaConfigId: planned.formulaId,
            requiresDegree: requiresScientificDegree('practice'),
            status: 'unassigned',
          },
          select: { id: true },
        });
        createdItems.push(created.id);
      }
    }

    return {
      createdCount: createdItems.length,
      skippedCount: skipped.length,
      createdIds: createdItems,
    };
  }

  /**
   * Rule 1 (single owner): `assignedTeacherId` is a scalar column — only one
   * teacher per item by DB schema.
   * Rule 13 (degree): if the item's `requiresDegree` is true (driven by
   * requiresScientificDegree()), the teacher must have hasScientificDegree=true.
   */
  async assign(
    id: string,
    dto: AssignWorkloadDto,
    performedByUserId: string,
  ) {
    const item = await this.findOne(id);
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        hasScientificDegree: true,
      },
    });
    if (!teacher) throw new BadRequestException(`Teacher not found`);
    if (!teacher.isActive) {
      throw new BadRequestException(`Teacher ${teacher.fullName} is inactive`);
    }
    if (item.requiresDegree && !teacher.hasScientificDegree) {
      throw new BadRequestException(
        `Rule 13: "${item.workloadType}" items require a teacher with a scientific degree — ${teacher.fullName} does not have one.`,
      );
    }

    const oldTeacherId = item.assignedTeacherId;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workloadItem.update({
        where: { id },
        data: { assignedTeacherId: teacher.id, status: 'assigned' },
        include,
      });
      await tx.assignmentLog.create({
        data: {
          workloadItemId: id,
          oldTeacherId,
          newTeacherId: teacher.id,
          action: oldTeacherId ? 'reassign' : 'assign',
          performedByUserId,
        },
      });
      return updated;
    });
  }

  async reassign(
    id: string,
    dto: ReassignWorkloadDto,
    performedByUserId: string,
  ) {
    // reassign is semantically identical to assign (the service transitions
    // old→new and logs the action); kept as a distinct endpoint to let the UI
    // add optional audit context in the future.
    void dto.reason;
    return this.assign(id, { teacherId: dto.teacherId }, performedByUserId);
  }

  async unassign(
    id: string,
    _dto: UnassignWorkloadDto,
    performedByUserId: string,
  ) {
    const item = await this.findOne(id);
    if (!item.assignedTeacherId) return item;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workloadItem.update({
        where: { id },
        data: { assignedTeacherId: null, status: 'unassigned' },
        include,
      });
      await tx.assignmentLog.create({
        data: {
          workloadItemId: id,
          oldTeacherId: item.assignedTeacherId,
          newTeacherId: null,
          action: 'unassign',
          performedByUserId,
        },
      });
      return updated;
    });
  }

  /**
   * §4.10 Teacher dashboard data: total hours, fall/spring breakdown,
   * auditorium vs non-auditorium, and the raw items.
   */
  async teacherSummary(teacherId: string, academicYearId?: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        fullName: true,
        position: true,
        degreeName: true,
        hasScientificDegree: true,
        annualNorm: true,
      },
    });
    if (!teacher) throw new NotFoundException(`Teacher ${teacherId} not found`);

    const items = await this.prisma.workloadItem.findMany({
      where: {
        assignedTeacherId: teacherId,
        ...(academicYearId ? { academicYearId } : {}),
      },
      include,
      orderBy: [
        { subjectOffering: { academicTerm: 'asc' } },
        { workloadType: 'asc' },
      ],
    });

    const sumHours = (predicate: (it: (typeof items)[number]) => boolean) =>
      items.filter(predicate).reduce((n, i) => n + i.plannedHours, 0);

    return {
      teacher,
      totals: {
        totalHours: sumHours(() => true),
        auditoriumHours: sumHours((i) => i.category === 'auditorium'),
        nonAuditoriumHours: sumHours((i) => i.category === 'non_auditorium'),
        items: items.length,
      },
      byTerm: {
        fall: sumHours((i) => i.subjectOffering?.academicTerm === 'fall'),
        spring: sumHours((i) => i.subjectOffering?.academicTerm === 'spring'),
      },
      items,
    };
  }

  // ─── helpers ───────────────────────────────────────────────────────────

  private async resolveContext(dto: CreateWorkloadItemDto) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
      select: { id: true },
    });
    if (!year) {
      throw new BadRequestException(
        `Academic year ${dto.academicYearId} not found`,
      );
    }

    let level: 'bachelor' | 'master' = 'bachelor';
    let studyType: 'full_time' | 'part_time' = 'full_time';
    let studentCount = dto.studentCount ?? 0;

    if (dto.lectureStreamId) {
      const stream = await this.prisma.lectureStream.findUnique({
        where: { id: dto.lectureStreamId },
        select: {
          totalStudentCount: true,
          subjectOffering: {
            select: {
              studyType: true,
              subject: { select: { level: true } },
            },
          },
        },
      });
      if (!stream) {
        throw new BadRequestException(
          `Lecture stream ${dto.lectureStreamId} not found`,
        );
      }
      level = stream.subjectOffering.subject.level;
      studyType = stream.subjectOffering.studyType;
      if (!studentCount) studentCount = stream.totalStudentCount;
    } else if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        select: { level: true, studyType: true, studentCount: true },
      });
      if (!group) throw new BadRequestException(`Group ${dto.groupId} not found`);
      level = group.level;
      studyType = group.studyType;
      if (!studentCount) studentCount = group.studentCount;
    } else if (dto.subjectOfferingId) {
      const off = await this.prisma.subjectOffering.findUnique({
        where: { id: dto.subjectOfferingId },
        select: {
          studyType: true,
          subject: { select: { level: true } },
        },
      });
      if (!off) {
        throw new BadRequestException(
          `Subject offering ${dto.subjectOfferingId} not found`,
        );
      }
      level = off.subject.level;
      studyType = off.studyType;
    }

    return { studentCount, level, studyType };
  }

  /**
   * Pick a formula (explicit id > active matching one > none) and compute hours.
   */
  private async computePlannedHours(params: {
    workloadType: WorkloadType;
    studentCount: number;
    level: 'bachelor' | 'master';
    studyType: 'full_time' | 'part_time';
    formulaConfigId: string | null;
  }) {
    let formula: FormulaConfig | null = null;
    if (params.formulaConfigId) {
      formula = await this.prisma.formulaConfig.findUnique({
        where: { id: params.formulaConfigId },
      });
    }
    if (!formula) {
      formula = await this.findMatchingFormula(
        params.workloadType,
        params.level,
        params.studyType,
      );
    }
    if (!formula) {
      return { hours: 0, formulaId: null as string | null };
    }
    const hours = evaluateFormula(formula, params.studentCount, 1);
    return { hours, formulaId: formula.id };
  }

  private async findMatchingFormula(
    workloadType: WorkloadType,
    level: 'bachelor' | 'master',
    studyType: 'full_time' | 'part_time',
  ) {
    // Only a subset of workload types have a matching FormulaScope value.
    const scopeMap: Partial<Record<WorkloadType, FormulaScope>> = {
      lecture: 'lecture',
      practice: 'practice',
      lab: 'lab',
      control: 'control',
      course_project: 'course_project',
      VQR: 'VQR',
      MD: 'MD',
      NDP: 'NDP',
      NS: 'NS',
    };
    const scope = scopeMap[workloadType];
    if (!scope) return null;
    return this.prisma.formulaConfig.findFirst({
      where: {
        scopeType: scope,
        level,
        studyType,
        isActive: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
