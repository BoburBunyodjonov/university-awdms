import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateFormula } from '../workload/formula-engine';
import type {
  CreateFormulaDto,
  FormulaQueryDto,
  PreviewFormulaDto,
  UpdateFormulaDto,
} from './dto/formula.dto';

@Injectable()
export class FormulasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: FormulaQueryDto) {
    const where = {
      ...(q.scopeType ? { scopeType: q.scopeType } : {}),
      ...(q.level ? { level: q.level } : {}),
      ...(q.studyType ? { studyType: q.studyType } : {}),
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
    } as Prisma.FormulaConfigWhereInput;

    const items = await this.prisma.formulaConfig.findMany({
      where,
      orderBy: [{ scopeType: 'asc' }, { effectiveFrom: 'desc' }, { name: 'asc' }],
    });
    return { items, total: items.length };
  }

  async findOne(id: string) {
    const formula = await this.prisma.formulaConfig.findUnique({
      where: { id },
    });
    if (!formula) throw new NotFoundException(`Formula ${id} not found`);
    return formula;
  }

  async create(dto: CreateFormulaDto) {
    try {
      return await this.prisma.formulaConfig.create({
        data: {
          ...dto,
          effectiveFrom: new Date(dto.effectiveFrom),
        } as Prisma.FormulaConfigUncheckedCreateInput,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'A formula with the same scope/level/studyType already exists for this effective date',
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateFormulaDto) {
    await this.findOne(id);
    try {
      return await this.prisma.formulaConfig.update({
        where: { id },
        data: {
          ...dto,
          effectiveFrom: dto.effectiveFrom
            ? new Date(dto.effectiveFrom)
            : undefined,
        } as Prisma.FormulaConfigUpdateInput,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Formula scope uniqueness violated');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const refs = await this.prisma.workloadItem.count({
      where: { formulaConfigId: id },
    });
    if (refs > 0) {
      // Safer to soft-delete to preserve historical calculation context on
      // existing workload items.
      return this.prisma.formulaConfig.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.formulaConfig.delete({ where: { id } });
  }

  // §4.5 — formula preview before applying. Computes planned hours using the
  // configured calculation mode, without persisting anything.
  async preview(id: string, input: PreviewFormulaDto) {
    const formula = await this.findOne(id);
    const planned = evaluateFormula(
      formula,
      input.studentCount,
      input.groupCount,
    );
    return { planned, formula };
  }
}
