import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateSubjectOfferingDto,
  LinkGroupsDto,
  SubjectOfferingQueryDto,
  UpdateSubjectOfferingDto,
} from './dto/subject-offering.dto';

const include = {
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
      level: true,
      directionId: true,
      direction: { select: { id: true, name: true, code: true } },
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
  _count: { select: { groupLinks: true, lectureStreams: true } },
} satisfies Prisma.SubjectOfferingInclude;

@Injectable()
export class SubjectOfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: SubjectOfferingQueryDto) {
    const where: Prisma.SubjectOfferingWhereInput = {
      ...(q.search
        ? {
            subject: {
              OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { code: { contains: q.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(q.subjectId ? { subjectId: q.subjectId } : {}),
      ...(q.directionId ? { subject: { directionId: q.directionId } } : {}),
      ...(q.studyType ? { studyType: q.studyType } : {}),
      ...(q.academicTerm ? { academicTerm: q.academicTerm } : {}),
      ...(q.courseYear ? { courseYear: q.courseYear } : {}),
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subjectOffering.findMany({
        where,
        include,
        orderBy: [
          { academicTerm: 'asc' },
          { courseYear: 'asc' },
          { semesterNumber: 'asc' },
          { subject: { name: 'asc' } },
        ],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.subjectOffering.count({ where }),
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
    const offering = await this.prisma.subjectOffering.findUnique({
      where: { id },
      include,
    });
    if (!offering) {
      throw new NotFoundException(`Subject offering ${id} not found`);
    }
    return offering;
  }

  async create(dto: CreateSubjectOfferingDto) {
    const subject = await this.loadSubjectOrThrow(dto.subjectId);
    if (dto.groupIds.length) {
      await this.assertGroupsMatchSubject(dto.groupIds, subject);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const offering = await tx.subjectOffering.create({
          data: {
            subjectId: dto.subjectId,
            studyType: dto.studyType,
            courseYear: dto.courseYear,
            semesterNumber: dto.semesterNumber,
            academicTerm: dto.academicTerm,
            isActive: dto.isActive ?? true,
          },
        });
        if (dto.groupIds.length) {
          await tx.subjectOfferingGroup.createMany({
            data: dto.groupIds.map((groupId) => ({
              subjectOfferingId: offering.id,
              groupId,
            })),
            skipDuplicates: true,
          });
        }
        return tx.subjectOffering.findUniqueOrThrow({
          where: { id: offering.id },
          include,
        });
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'An offering for this subject/term/course/studyType already exists',
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateSubjectOfferingDto) {
    const current = await this.findOne(id);
    const subjectId = dto.subjectId ?? current.subjectId;
    const subject =
      dto.subjectId && dto.subjectId !== current.subjectId
        ? await this.loadSubjectOrThrow(subjectId)
        : current.subject;

    if (dto.groupIds) {
      await this.assertGroupsMatchSubject(dto.groupIds, subject);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const offering = await tx.subjectOffering.update({
          where: { id },
          data: {
            subjectId: dto.subjectId,
            studyType: dto.studyType,
            courseYear: dto.courseYear,
            semesterNumber: dto.semesterNumber,
            academicTerm: dto.academicTerm,
            isActive: dto.isActive,
          },
        });
        if (dto.groupIds) {
          await tx.subjectOfferingGroup.deleteMany({
            where: { subjectOfferingId: id },
          });
          if (dto.groupIds.length) {
            await tx.subjectOfferingGroup.createMany({
              data: dto.groupIds.map((groupId) => ({
                subjectOfferingId: offering.id,
                groupId,
              })),
              skipDuplicates: true,
            });
          }
        }
        return tx.subjectOffering.findUniqueOrThrow({
          where: { id: offering.id },
          include,
        });
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'An offering for this subject/term/course/studyType already exists',
        );
      }
      throw err;
    }
  }

  async setGroups(id: string, dto: LinkGroupsDto) {
    const offering = await this.findOne(id);
    await this.assertGroupsMatchSubject(dto.groupIds, offering.subject);
    await this.prisma.$transaction([
      this.prisma.subjectOfferingGroup.deleteMany({
        where: { subjectOfferingId: id },
      }),
      this.prisma.subjectOfferingGroup.createMany({
        data: dto.groupIds.map((groupId) => ({
          subjectOfferingId: id,
          groupId,
        })),
        skipDuplicates: true,
      }),
    ]);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.subjectOffering.delete({ where: { id } });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2003' || code === 'P2014') {
        throw new BadRequestException(
          'Cannot delete: this offering has lecture streams or workload items',
        );
      }
      throw err;
    }
  }

  private async loadSubjectOrThrow(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: { direction: { select: { id: true, name: true, code: true } } },
    });
    if (!subject) {
      throw new BadRequestException(`Subject ${subjectId} not found`);
    }
    return subject;
  }

  private async assertGroupsMatchSubject(
    groupIds: string[],
    subject: { id: string; directionId: string; level: 'bachelor' | 'master' },
  ) {
    if (!groupIds.length) return;
    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, name: true, directionId: true, level: true },
    });
    if (groups.length !== groupIds.length) {
      throw new BadRequestException('One or more groupIds do not exist');
    }
    const bad = groups.filter(
      (g) => g.directionId !== subject.directionId || g.level !== subject.level,
    );
    if (bad.length) {
      throw new BadRequestException(
        `Group(s) ${bad.map((g) => g.name).join(', ')} do not match the subject's direction/level`,
      );
    }
  }
}
