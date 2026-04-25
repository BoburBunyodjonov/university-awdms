import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateTeacherDto,
  TeacherQueryDto,
  UpdateTeacherDto,
} from './dto/teacher.dto';

function hasScientificDegree(degreeName?: string) {
  return degreeName === 'PhD' || degreeName === 'DSc';
}

function normalizeTeacherDegree<T extends CreateTeacherDto | UpdateTeacherDto>(
  dto: T,
): T {
  if (!dto.degreeName) return dto;
  return {
    ...dto,
    hasScientificDegree: hasScientificDegree(dto.degreeName),
  };
}

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: TeacherQueryDto) {
    const where: Prisma.TeacherWhereInput = {
      ...(q.search
        ? {
            OR: [
              { fullName: { contains: q.search, mode: 'insensitive' } },
              { degreeName: { contains: q.search, mode: 'insensitive' } },
              { position: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
      ...(q.hasScientificDegree !== undefined
        ? { hasScientificDegree: q.hasScientificDegree }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.teacher.count({ where }),
    ]);

    const teacherIds = items.map((t) => t.id);
    const hoursByTeacher = new Map<
      string,
      { aud: number; non: number }
    >();
    if (teacherIds.length > 0) {
      const groupSums = await this.prisma.workloadItem.groupBy({
        by: ['assignedTeacherId', 'category'],
        where: { assignedTeacherId: { in: teacherIds } },
        _sum: { plannedHours: true },
      });
      for (const row of groupSums) {
        const id = row.assignedTeacherId;
        if (!id) continue;
        const h = row._sum.plannedHours ?? 0;
        const o = hoursByTeacher.get(id) ?? { aud: 0, non: 0 };
        if (row.category === 'auditorium') o.aud += h;
        else o.non += h;
        hoursByTeacher.set(id, o);
      }
    }

    const itemsWithHours = items.map((t) => {
      const h = hoursByTeacher.get(t.id) ?? { aud: 0, non: 0 };
      return {
        ...t,
        auditoriumHours: h.aud,
        nonAuditoriumHours: h.non,
      };
    });

    return {
      items: itemsWithHours,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException(`Teacher ${id} not found`);
    return teacher;
  }

  /**
   * Simplified module profile: summary fields plus a compact `assignedWorkloads`
   * list (hujjatdagi soddalashgan ko‘rinish). To‘liq qatorlar GET /teachers/:id/workload
   * / my-workload orqali ham mavjud.
   */
  async getModuleProfile(teacherId: string) {
    const t = await this.findOne(teacherId);
    const items = await this.prisma.workloadItem.findMany({
      where: { assignedTeacherId: teacherId },
      orderBy: [
        { subjectOffering: { academicTerm: 'asc' } },
        { workloadType: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        workloadType: true,
        plannedHours: true,
        status: true,
        subjectOffering: {
          select: {
            academicTerm: true,
            courseYear: true,
            semesterNumber: true,
            subject: { select: { code: true, name: true } },
          },
        },
      },
    });
    const assignedWorkloads = items.map((i) => ({
      id: i.id,
      workloadType: i.workloadType,
      plannedHours: i.plannedHours,
      status: i.status,
      subjectCode: i.subjectOffering?.subject.code ?? null,
      subjectName: i.subjectOffering?.subject.name ?? null,
      academicTerm: i.subjectOffering?.academicTerm ?? null,
      courseYear: i.subjectOffering?.courseYear ?? null,
      semesterNumber: i.subjectOffering?.semesterNumber ?? null,
    }));
    return {
      fullName: t.fullName,
      degree:
        t.degreeName === 'DSc'
          ? 'DSc'
          : t.hasScientificDegree
            ? 'PhD'
            : 'NoDegree',
      annualNorm: t.annualNorm,
      position: t.position,
      degreeName: t.degreeName,
      hasScientificDegree: t.hasScientificDegree,
      isActive: t.isActive,
      assignedWorkloads,
      workloadItemsCount: items.length,
    };
  }

  create(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({ data: normalizeTeacherDegree(dto) });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    await this.findOne(id);
    return this.prisma.teacher.update({
      where: { id },
      data: normalizeTeacherDegree(dto),
    });
  }

  // Soft delete: teachers referenced by workload items / logs cannot be hard-deleted
  // (FK is SetNull for assignments but Restrict for logs), so we flip isActive.
  // Hard-delete path kept for teachers with zero references.
  async remove(id: string) {
    const teacher = await this.findOne(id);
    const refs = await this.prisma.workloadItem.count({
      where: { assignedTeacherId: id },
    });
    if (refs > 0 || !teacher.isActive) {
      return this.prisma.teacher.update({
        where: { id },
        data: { isActive: false },
      });
    }
    try {
      return await this.prisma.teacher.delete({ where: { id } });
    } catch (err) {
      // Fallback to soft-delete if FK constraint fires (e.g. assignment_logs).
      const code = (err as { code?: string })?.code;
      if (code === 'P2003' || code === 'P2014') {
        return this.prisma.teacher.update({
          where: { id },
          data: { isActive: false },
        });
      }
      throw err;
    }
  }

  async ensureEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email is already in use');
  }
}
