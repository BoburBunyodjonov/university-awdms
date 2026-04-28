import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AssignStreamTeacherDto,
  CreateLectureStreamDto,
  LectureStreamQueryDto,
  UpdateLectureStreamDto,
} from './dto/lecture-stream.dto';

const include = {
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
          lectureCoefficient: true,
          controlCoefficient: true,
          practiceCoefficient: true,
          level: true,
          directionId: true,
          direction: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
  teacher: {
    select: {
      id: true,
      fullName: true,
      hasScientificDegree: true,
    },
  },
  groupLinks: {
    include: {
      group: {
        select: {
          id: true,
          name: true,
          language: true,
          studentCount: true,
          courseYear: true,
        },
      },
    },
  },
  _count: { select: { groupLinks: true, workloadItems: true } },
} satisfies Prisma.LectureStreamInclude;

@Injectable()
export class LectureStreamsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Avoid NaN on stream hour fields if a coefficient is ever null/undefined. */
  private subjectStreamHourWeights(subject: {
    lectureCoefficient: number;
    controlCoefficient: number;
  }) {
    return {
      lecture: Math.max(0, Number(subject.lectureCoefficient ?? 0) || 0),
      control: Math.max(0, Number(subject.controlCoefficient ?? 0) || 0),
    };
  }

  async list(q: LectureStreamQueryDto) {
    const where: Prisma.LectureStreamWhereInput = {
      ...(q.subjectOfferingId ? { subjectOfferingId: q.subjectOfferingId } : {}),
      ...(q.language ? { language: q.language } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.teacherId ? { teacherId: q.teacherId } : {}),
      ...(q.directionId
        ? { subjectOffering: { subject: { directionId: q.directionId } } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lectureStream.findMany({
        where,
        include,
        orderBy: [{ createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.lectureStream.count({ where }),
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
    const stream = await this.prisma.lectureStream.findUnique({
      where: { id },
      include,
    });
    if (!stream) throw new NotFoundException(`Stream ${id} not found`);
    return stream;
  }

  async create(dto: CreateLectureStreamDto) {
    const { groupIds, language } = dto;
    const { offering, groups, totalStudentCount } =
      await this.validateGroupsForOffering(dto.subjectOfferingId, groupIds, language);

    if (dto.teacherId) await this.ensureTeacherExists(dto.teacherId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const w = this.subjectStreamHourWeights(offering.subject);
        const stream = await tx.lectureStream.create({
          data: {
            name: dto.name,
            subjectOfferingId: offering.id,
            language,
            totalStudentCount,
            lectureHours: totalStudentCount * w.lecture,
            controlHours: totalStudentCount * w.control,
            teacherId: dto.teacherId ?? null,
            status: dto.status ?? 'draft',
          },
        });
        await tx.streamGroup.createMany({
          data: groups.map((g) => ({
            streamId: stream.id,
            groupId: g.id,
            // Denormalized from the parent stream so the @@unique([groupId,subjectOfferingId])
            // constraint on StreamGroup fires — this is the DB-level guard for
            // "one stream per group per offering".
            subjectOfferingId: offering.id,
          })),
        });
        return tx.lectureStream.findUniqueOrThrow({
          where: { id: stream.id },
          include,
        });
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        throw new ConflictException(
          'One or more groups are already in another stream for this offering',
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateLectureStreamDto) {
    const current = await this.findOne(id);

    // Resolve the final state after the patch, then re-validate holistically.
    const offeringId = dto.subjectOfferingId ?? current.subjectOfferingId;
    const language = dto.language ?? current.language;
    const groupIds =
      dto.groupIds ?? current.groupLinks.map((l) => l.groupId);

    const { offering, groups, totalStudentCount } =
      await this.validateGroupsForOffering(offeringId, groupIds, language, id);

    if (dto.teacherId) await this.ensureTeacherExists(dto.teacherId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const w = this.subjectStreamHourWeights(offering.subject);
        const stream = await tx.lectureStream.update({
          where: { id },
          data: {
            name: dto.name,
            subjectOfferingId: offering.id,
            language,
            totalStudentCount,
            lectureHours: totalStudentCount * w.lecture,
            controlHours: totalStudentCount * w.control,
            teacherId: dto.teacherId !== undefined ? dto.teacherId : undefined,
            status: dto.status,
          },
        });
        if (dto.groupIds || dto.subjectOfferingId) {
          await tx.streamGroup.deleteMany({ where: { streamId: id } });
          await tx.streamGroup.createMany({
            data: groups.map((g) => ({
              streamId: stream.id,
              groupId: g.id,
              subjectOfferingId: offering.id,
            })),
          });
        }
        return tx.lectureStream.findUniqueOrThrow({
          where: { id: stream.id },
          include,
        });
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        throw new ConflictException(
          'One or more groups are already in another stream for this offering',
        );
      }
      throw err;
    }
  }

  async assignTeacher(id: string, dto: AssignStreamTeacherDto) {
    await this.findOne(id);
    await this.ensureTeacherExists(dto.teacherId);
    return this.prisma.lectureStream.update({
      where: { id },
      data: { teacherId: dto.teacherId, status: 'assigned' },
      include,
    });
  }

  async unassignTeacher(id: string) {
    await this.findOne(id);
    return this.prisma.lectureStream.update({
      where: { id },
      data: { teacherId: null, status: 'draft' },
      include,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.lectureStream.delete({ where: { id } });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2003' || code === 'P2014') {
        throw new BadRequestException(
          'Cannot delete: this stream still has workload items attached',
        );
      }
      throw err;
    }
  }

  /**
   * Centralised validation for Rules 6 / 8 / 10 and group-per-offering uniqueness.
   *
   * - All group ids must exist.
   * - Every group must be linked to the subject offering
   *   (you can't build a stream over groups that don't take the subject).
   * - Every group's `language` must equal the stream `language` (Rule 8).
   */
  private async validateGroupsForOffering(
    subjectOfferingId: string,
    groupIds: string[],
    language: 'uzbek' | 'russian',
    excludeStreamId?: string,
  ) {
    if (!groupIds.length) {
      throw new BadRequestException('At least one group is required');
    }

    const offering = await this.prisma.subjectOffering.findUnique({
      where: { id: subjectOfferingId },
      include: {
        groupLinks: { select: { groupId: true } },
        subject: {
          select: {
            directionId: true,
            level: true,
            name: true,
            lectureCoefficient: true,
            controlCoefficient: true,
            practiceCoefficient: true,
          },
        },
      },
    });
    if (!offering) {
      throw new BadRequestException(
        `Subject offering ${subjectOfferingId} not found`,
      );
    }

    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: {
        id: true,
        name: true,
        language: true,
        directionId: true,
        level: true,
        studentCount: true,
      },
    });
    if (groups.length !== groupIds.length) {
      throw new BadRequestException('One or more groupIds do not exist');
    }

    // Every selected group must belong to this offering (be in subject_offering_groups).
    const offeringGroupSet = new Set(offering.groupLinks.map((l) => l.groupId));
    const notLinked = groups.filter((g) => !offeringGroupSet.has(g.id));
    if (notLinked.length) {
      throw new BadRequestException(
        `Groups not linked to this offering: ${notLinked.map((g) => g.name).join(', ')}`,
      );
    }

    // Rule 8 — all groups in a stream share a single instruction language.
    const mismatched = groups.filter((g) => g.language !== language);
    if (mismatched.length) {
      throw new BadRequestException(
        `Language mismatch — every group must be "${language}". Offending: ${mismatched
          .map((g) => `${g.name} (${g.language})`)
          .join(', ')}`,
      );
    }

    // Belt-and-braces (the @@unique handles this at DB level, but surface it as 400
    // instead of a P2002 if the caller tries to build over a stream-occupied group).
    const conflict = await this.prisma.streamGroup.findMany({
      where: {
        subjectOfferingId: offering.id,
        groupId: { in: groupIds },
        ...(excludeStreamId ? { streamId: { not: excludeStreamId } } : {}),
      },
      select: { groupId: true, streamId: true },
    });
    if (conflict.length) {
      const names = conflict
        .map(
          (c) =>
            groups.find((g) => g.id === c.groupId)?.name ??
            c.groupId.slice(0, 6),
        )
        .join(', ');
      throw new ConflictException(
        `Already in another stream of this offering: ${names}`,
      );
    }

    const totalStudentCount = groups.reduce((n, g) => n + g.studentCount, 0);

    return { offering, groups, totalStudentCount };
  }

  private async ensureTeacherExists(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, isActive: true },
    });
    if (!teacher) {
      throw new BadRequestException(`Teacher ${teacherId} not found`);
    }
    if (!teacher.isActive) {
      throw new BadRequestException(`Teacher ${teacherId} is inactive`);
    }
  }
}
