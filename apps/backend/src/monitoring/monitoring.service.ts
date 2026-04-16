import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface MonitoringSummary {
  academicYearId: string | null;
  totals: {
    totalHours: number;
    auditoriumHours: number;
    nonAuditoriumHours: number;
    items: number;
    assigned: number;
    unassigned: number;
    invalid: number;
  };
  byCategory: { category: 'auditorium' | 'non_auditorium'; hours: number; count: number }[];
  byType: { type: string; hours: number; count: number }[];
  teachers: TeacherLoad[];
  overNorm: TeacherLoad[];
  underNorm: TeacherLoad[];
}

export interface TeacherLoad {
  id: string;
  fullName: string;
  hasScientificDegree: boolean;
  annualNorm: number;
  assignedHours: number;
  delta: number; // positive = over norm
  utilisation: number; // 0..1 (>1 means over)
}

@Injectable()
export class MonitoringService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(academicYearId?: string): Promise<MonitoringSummary> {
    const where: Prisma.WorkloadItemWhereInput = academicYearId
      ? { academicYearId }
      : {};

    const items = await this.prisma.workloadItem.findMany({
      where,
      include: {
        assignedTeacher: {
          select: {
            id: true,
            fullName: true,
            hasScientificDegree: true,
            annualNorm: true,
          },
        },
      },
    });

    const activeTeachers = await this.prisma.teacher.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        hasScientificDegree: true,
        annualNorm: true,
      },
    });

    const totalHours = items.reduce((n, i) => n + i.plannedHours, 0);
    const auditoriumHours = items
      .filter((i) => i.category === 'auditorium')
      .reduce((n, i) => n + i.plannedHours, 0);
    const nonAuditoriumHours = totalHours - auditoriumHours;

    const unassigned = items.filter((i) => !i.assignedTeacherId).length;
    const invalid = items.filter((i) => i.status === 'invalid').length;

    const byCategoryMap = new Map<
      'auditorium' | 'non_auditorium',
      { hours: number; count: number }
    >();
    const byTypeMap = new Map<string, { hours: number; count: number }>();
    for (const item of items) {
      const c = byCategoryMap.get(item.category) ?? { hours: 0, count: 0 };
      c.hours += item.plannedHours;
      c.count += 1;
      byCategoryMap.set(item.category, c);

      const k = byTypeMap.get(item.workloadType) ?? { hours: 0, count: 0 };
      k.hours += item.plannedHours;
      k.count += 1;
      byTypeMap.set(item.workloadType, k);
    }

    // Teacher load table. Include every active teacher (even ones with 0 assigned
    // hours) so the dashboard shows under-loaded teachers too.
    const loadByTeacherId = new Map<string, number>();
    for (const item of items) {
      if (!item.assignedTeacherId) continue;
      loadByTeacherId.set(
        item.assignedTeacherId,
        (loadByTeacherId.get(item.assignedTeacherId) ?? 0) + item.plannedHours,
      );
    }

    const teachers: TeacherLoad[] = activeTeachers.map((t) => {
      const assignedHours = loadByTeacherId.get(t.id) ?? 0;
      return {
        id: t.id,
        fullName: t.fullName,
        hasScientificDegree: t.hasScientificDegree,
        annualNorm: t.annualNorm,
        assignedHours,
        delta: assignedHours - t.annualNorm,
        utilisation: t.annualNorm > 0 ? assignedHours / t.annualNorm : 0,
      };
    });
    teachers.sort((a, b) => b.assignedHours - a.assignedHours);

    const overNorm = teachers.filter((t) => t.delta > 0);
    const underNorm = teachers.filter(
      (t) => t.delta < 0 && t.assignedHours > 0,
    );

    return {
      academicYearId: academicYearId ?? null,
      totals: {
        totalHours,
        auditoriumHours,
        nonAuditoriumHours,
        items: items.length,
        assigned: items.length - unassigned,
        unassigned,
        invalid,
      },
      byCategory: [...byCategoryMap.entries()].map(([category, v]) => ({
        category,
        hours: v.hours,
        count: v.count,
      })),
      byType: [...byTypeMap.entries()]
        .map(([type, v]) => ({ type, hours: v.hours, count: v.count }))
        .sort((a, b) => b.hours - a.hours),
      teachers,
      overNorm,
      underNorm,
    };
  }

  async unassigned(academicYearId?: string) {
    return this.prisma.workloadItem.findMany({
      where: {
        assignedTeacherId: null,
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        subjectOffering: { include: { subject: true } },
        lectureStream: { select: { id: true, language: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: [{ workloadType: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
