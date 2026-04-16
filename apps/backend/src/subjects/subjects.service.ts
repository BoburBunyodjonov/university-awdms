import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateSubjectDto,
  SubjectQueryDto,
  UpdateSubjectDto,
} from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: SubjectQueryDto) {
    const where: Prisma.SubjectWhereInput = {
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { code: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.directionId ? { directionId: q.directionId } : {}),
      ...(q.level ? { level: q.level } : {}),
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subject.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        include: {
          direction: { select: { id: true, name: true, code: true } },
          _count: { select: { offerings: true } },
        },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.subject.count({ where }),
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
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        direction: { select: { id: true, name: true, code: true } },
        _count: { select: { offerings: true } },
      },
    });
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);
    return subject;
  }

  async create(dto: CreateSubjectDto) {
    await this.assertDirectionMatchesLevel(dto.directionId, dto.level);
    try {
      return await this.prisma.subject.create({
        data: dto,
        include: {
          direction: { select: { id: true, name: true, code: true } },
          _count: { select: { offerings: true } },
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          `Subject "${dto.name}" already exists under this direction`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateSubjectDto) {
    const current = await this.findOne(id);
    if (dto.directionId || dto.level) {
      await this.assertDirectionMatchesLevel(
        dto.directionId ?? current.directionId,
        dto.level ?? current.level,
      );
    }
    try {
      return await this.prisma.subject.update({
        where: { id },
        data: dto,
        include: {
          direction: { select: { id: true, name: true, code: true } },
          _count: { select: { offerings: true } },
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Subject name must be unique per direction');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const subject = await this.findOne(id);
    if (subject._count.offerings > 0) {
      throw new BadRequestException(
        `Cannot delete: ${subject._count.offerings} subject offering(s) still reference this subject`,
      );
    }
    return this.prisma.subject.delete({ where: { id } });
  }

  private async assertDirectionMatchesLevel(
    directionId: string,
    level: 'bachelor' | 'master',
  ) {
    const direction = await this.prisma.direction.findUnique({
      where: { id: directionId },
      select: { level: true, name: true },
    });
    if (!direction) {
      throw new BadRequestException(`Direction ${directionId} not found`);
    }
    if (direction.level !== level) {
      throw new BadRequestException(
        `Subject level "${level}" does not match direction "${direction.name}" level "${direction.level}"`,
      );
    }
  }
}
