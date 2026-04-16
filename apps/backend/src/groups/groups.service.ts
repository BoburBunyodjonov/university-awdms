import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateGroupDto,
  GroupQueryDto,
  UpdateGroupDto,
} from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: GroupQueryDto) {
    const where: Prisma.GroupWhereInput = {
      ...(q.search
        ? { name: { contains: q.search, mode: 'insensitive' } }
        : {}),
      ...(q.directionId ? { directionId: q.directionId } : {}),
      ...(q.language ? { language: q.language } : {}),
      ...(q.level ? { level: q.level } : {}),
      ...(q.academicTerm ? { academicTerm: q.academicTerm } : {}),
      ...(q.courseYear ? { courseYear: q.courseYear } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        orderBy: [{ courseYear: 'asc' }, { name: 'asc' }],
        include: { direction: { select: { id: true, name: true, code: true } } },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.group.count({ where }),
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
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { direction: { select: { id: true, name: true, code: true } } },
    });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  async create(dto: CreateGroupDto) {
    await this.assertDirectionMatchesLevel(dto.directionId, dto.level);
    try {
      return await this.prisma.group.create({
        data: dto,
        include: { direction: { select: { id: true, name: true, code: true } } },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(`Group name "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateGroupDto) {
    const current = await this.findOne(id);
    if (dto.directionId || dto.level) {
      await this.assertDirectionMatchesLevel(
        dto.directionId ?? current.directionId,
        dto.level ?? current.level,
      );
    }
    try {
      return await this.prisma.group.update({
        where: { id },
        data: dto,
        include: { direction: { select: { id: true, name: true, code: true } } },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Group name must be unique');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.group.delete({ where: { id } });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2003' || code === 'P2014') {
        throw new BadRequestException(
          'Cannot delete: group is referenced by a subject offering, stream, or workload item',
        );
      }
      throw err;
    }
  }

  // Rule consistency: a master's group cannot belong to a bachelor direction,
  // and vice versa. This is not a hard DB constraint (level is duplicated on
  // both tables), so we enforce it in the service layer.
  private async assertDirectionMatchesLevel(
    directionId: string,
    level: 'bachelor' | 'master',
  ) {
    const direction = await this.prisma.direction.findUnique({
      where: { id: directionId },
      select: { id: true, level: true, name: true },
    });
    if (!direction) {
      throw new BadRequestException(`Direction ${directionId} not found`);
    }
    if (direction.level !== level) {
      throw new BadRequestException(
        `Group level "${level}" does not match direction "${direction.name}" level "${direction.level}"`,
      );
    }
  }
}
