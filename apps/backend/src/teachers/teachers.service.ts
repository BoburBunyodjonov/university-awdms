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

    return {
      items,
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

  create(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({ data: dto });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    await this.findOne(id);
    return this.prisma.teacher.update({ where: { id }, data: dto });
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
