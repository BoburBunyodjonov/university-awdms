import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from './dto/academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.academicYear.findMany({
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    });
  }

  async findOne(id: string) {
    const year = await this.prisma.academicYear.findUnique({ where: { id } });
    if (!year) throw new NotFoundException(`Academic year ${id} not found`);
    return year;
  }

  async create(dto: CreateAcademicYearDto) {
    try {
      return await this.prisma.academicYear.create({
        data: {
          name: dto.name,
          isActive: dto.isActive ?? false,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          `Academic year "${dto.name}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(id);
    return this.prisma.academicYear.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const used = await this.prisma.workloadItem.count({
      where: { academicYearId: id },
    });
    if (used > 0) {
      throw new BadRequestException(
        `Cannot delete: ${used} workload item(s) reference this year`,
      );
    }
    return this.prisma.academicYear.delete({ where: { id } });
  }
}
