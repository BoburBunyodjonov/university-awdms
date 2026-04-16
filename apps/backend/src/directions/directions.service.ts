import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateDirectionDto,
  DirectionQueryDto,
  UpdateDirectionDto,
} from './dto/direction.dto';

@Injectable()
export class DirectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: DirectionQueryDto) {
    const where: Prisma.DirectionWhereInput = {
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { code: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.level ? { level: q.level } : {}),
    };

    const items = await this.prisma.direction.findMany({
      where,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { groups: true, subjects: true } } },
    });

    return { items, total: items.length };
  }

  async findOne(id: string) {
    const direction = await this.prisma.direction.findUnique({
      where: { id },
      include: { _count: { select: { groups: true, subjects: true } } },
    });
    if (!direction) throw new NotFoundException(`Direction ${id} not found`);
    return direction;
  }

  async create(dto: CreateDirectionDto) {
    try {
      return await this.prisma.direction.create({ data: dto });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          `Direction with code "${dto.code}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateDirectionDto) {
    await this.findOne(id);
    try {
      return await this.prisma.direction.update({ where: { id }, data: dto });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Direction code must be unique');
      }
      throw err;
    }
  }

  async remove(id: string) {
    // Direction → Group and Direction → SubjectOffering are onDelete: Restrict,
    // so deletion fails at the DB if anything references it. Convert to a
    // friendly error instead of surfacing a raw P2003.
    const dir = await this.prisma.direction.findUnique({
      where: { id },
      include: { _count: { select: { groups: true, subjects: true } } },
    });
    if (!dir) throw new NotFoundException(`Direction ${id} not found`);

    const refCount = dir._count.groups + dir._count.subjects;
    if (refCount > 0) {
      throw new BadRequestException(
        `Cannot delete: ${dir._count.groups} group(s) and ${dir._count.subjects} subject(s) still reference this direction`,
      );
    }
    return this.prisma.direction.delete({ where: { id } });
  }
}
