import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monitoring: MonitoringService,
  ) {}

  /**
   * Resolves the academic year for exports: explicit id, else the single active year.
   */
  async resolveAcademicYearId(academicYearId?: string) {
    if (academicYearId) {
      const y = await this.prisma.academicYear.findUnique({
        where: { id: academicYearId },
        select: { id: true },
      });
      if (!y) throw new NotFoundException(`Academic year ${academicYearId} not found`);
      return y.id;
    }
    const active = await this.prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!active) {
      throw new BadRequestException(
        'academicYearId is required (no active academic year configured)',
      );
    }
    return active.id;
  }

  /**
   * Produce a department-wide workload workbook for a given academic year.
   * Three sheets:
   *   1. Summary     — totals, counts, category/type breakdown
   *   2. Teachers    — per-teacher hours vs annual norm + over/under flags
   *   3. Items       — full list of workload items, one per row
   */
  async departmentWorkbook(academicYearId: string): Promise<Buffer> {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });
    if (!year) {
      throw new NotFoundException(`Academic year ${academicYearId} not found`);
    }

    const summary = await this.monitoring.summary(academicYearId);
    const items = await this.prisma.workloadItem.findMany({
      where: { academicYearId },
      include: {
        subjectOffering: {
          select: {
            academicTerm: true,
            courseYear: true,
            semesterNumber: true,
            studyType: true,
            subject: {
              select: {
                name: true,
                code: true,
                level: true,
                direction: { select: { name: true, code: true } },
              },
            },
          },
        },
        lectureStream: { select: { language: true, totalStudentCount: true } },
        group: { select: { name: true, language: true } },
        assignedTeacher: {
          select: { fullName: true, hasScientificDegree: true, position: true },
        },
        formulaConfig: { select: { name: true } },
      },
      orderBy: [
        { subjectOffering: { academicTerm: 'asc' } },
        { workloadType: 'asc' },
      ],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'AWDMS';
    wb.created = new Date();
    wb.company = 'University Department';

    this.fillSummarySheet(wb, year.name, summary);
    this.fillTeachersSheet(wb, summary);
    this.fillItemsSheet(wb, items);

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * One teacher's workload, intended for their individual report (§8.9).
   */
  async teacherWorkbook(
    teacherId: string,
    academicYearId: string,
  ): Promise<Buffer> {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });
    if (!year) {
      throw new NotFoundException(`Academic year ${academicYearId} not found`);
    }
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher ${teacherId} not found`);
    }

    const items = await this.prisma.workloadItem.findMany({
      where: { academicYearId, assignedTeacherId: teacherId },
      include: {
        subjectOffering: {
          select: {
            academicTerm: true,
            courseYear: true,
            semesterNumber: true,
            studyType: true,
            subject: { select: { name: true, code: true, level: true } },
          },
        },
        lectureStream: { select: { language: true, totalStudentCount: true } },
        group: { select: { name: true, language: true } },
        formulaConfig: { select: { name: true } },
        assignedTeacher: { select: { fullName: true, hasScientificDegree: true, position: true } },
      },
      orderBy: [
        { subjectOffering: { academicTerm: 'asc' } },
        { workloadType: 'asc' },
      ],
    });

    const total = items.reduce((n, i) => n + i.plannedHours, 0);
    const auditorium = items
      .filter((i) => i.category === 'auditorium')
      .reduce((n, i) => n + i.plannedHours, 0);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'AWDMS';
    wb.created = new Date();

    const sheet = wb.addWorksheet('My workload');
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = `Individual workload report — ${teacher.fullName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { vertical: 'middle' };

    sheet.addRow([]);
    sheet.addRow(['Academic year', year.name]);
    sheet.addRow(['Position', teacher.position]);
    sheet.addRow(['Degree', teacher.degreeName]);
    sheet.addRow(['Annual norm (h)', teacher.annualNorm]);
    sheet.addRow(['Assigned total (h)', total]);
    sheet.addRow(['Auditorium (h)', auditorium]);
    sheet.addRow(['Non-auditorium (h)', total - auditorium]);
    sheet.addRow([]);

    this.fillItemsSheet(wb, items, 'Items');

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ───────────────────────────── sheets ─────────────────────────────

  private fillSummarySheet(
    wb: ExcelJS.Workbook,
    yearName: string,
    summary: Awaited<ReturnType<MonitoringService['summary']>>,
  ) {
    const s = wb.addWorksheet('Summary');
    s.mergeCells('A1:C1');
    s.getCell('A1').value = `AWDMS Department Workload Report`;
    s.getCell('A1').font = { bold: true, size: 14 };

    s.addRow(['Academic year', yearName]);
    s.addRow(['Generated at', new Date().toISOString()]);
    s.addRow([]);

    s.addRow(['Totals']).font = { bold: true };
    s.addRow(['Total hours', summary.totals.totalHours]);
    s.addRow(['Assigned hours (on teachers)', summary.totals.assignedHours]);
    s.addRow(['Department norm (sum, active teachers)', summary.totals.totalDepartmentNorm]);
    s.addRow(['Remaining norm (dept.)', summary.totals.remainingNormHours]);
    s.addRow(['Active teachers', summary.totals.activeTeacherCount]);
    s.addRow(['Auditorium hours', summary.totals.auditoriumHours]);
    s.addRow(['Non-auditorium hours', summary.totals.nonAuditoriumHours]);
    s.addRow(['Items', summary.totals.items]);
    s.addRow(['Assigned items', summary.totals.assigned]);
    s.addRow(['Unassigned', summary.totals.unassigned]);
    s.addRow(['Invalid', summary.totals.invalid]);
    s.addRow([]);

    s.addRow(['By workload type', 'Hours', 'Items']).font = { bold: true };
    summary.byType.forEach((row) =>
      s.addRow([row.type, row.hours, row.count]),
    );

    s.columns = [{ width: 28 }, { width: 18 }, { width: 10 }];
  }

  private fillTeachersSheet(
    wb: ExcelJS.Workbook,
    summary: Awaited<ReturnType<MonitoringService['summary']>>,
  ) {
    const s = wb.addWorksheet('Teachers');
    s.columns = [
      { header: 'Teacher', key: 'name', width: 32 },
      { header: 'Degree', key: 'degree', width: 10 },
      { header: 'Annual norm', key: 'norm', width: 14 },
      { header: 'Assigned', key: 'assigned', width: 14 },
      { header: 'Δ (over norm)', key: 'delta', width: 14 },
      { header: 'Utilisation', key: 'util', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    s.getRow(1).font = { bold: true };
    s.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' },
    };

    for (const t of summary.teachers) {
      const status =
        t.delta > 0 ? 'Over norm' : t.delta < 0 ? 'Under norm' : 'On target';
      const row = s.addRow({
        name: t.fullName,
        degree: t.hasScientificDegree ? '★' : '',
        norm: t.annualNorm,
        assigned: t.assignedHours,
        delta: t.delta,
        util: t.utilisation,
        status,
      });
      row.getCell('util').numFmt = '0.00%';
      if (t.delta > 0) {
        row.getCell('status').font = { color: { argb: 'FFB42318' }, bold: true };
      } else if (t.delta < 0 && t.assignedHours > 0) {
        row.getCell('status').font = { color: { argb: 'FFA16207' } };
      } else if (t.assignedHours === 0) {
        row.getCell('status').font = { color: { argb: 'FF71717A' } };
      }
    }
    s.autoFilter = { from: 'A1', to: { row: 1, column: s.columns.length } };
  }

  private fillItemsSheet(
    wb: ExcelJS.Workbook,
    items: Array<{
      workloadType: string;
      category: string;
      studentCount: number;
      plannedHours: number;
      status: string;
      requiresDegree: boolean;
      subjectOffering: {
        academicTerm: string;
        courseYear: number;
        semesterNumber: number;
        studyType: string;
        subject: {
          name: string;
          code: string | null;
          level: string;
          direction?: { name: string; code: string };
        };
      } | null;
      lectureStream: { language: string; totalStudentCount: number } | null;
      group: { name: string; language: string } | null;
      assignedTeacher: {
        fullName: string;
        hasScientificDegree: boolean;
      } | null;
      formulaConfig: { name: string } | null;
    }>,
    sheetName = 'Items',
  ) {
    const s = wb.addWorksheet(sheetName);
    s.columns = [
      { header: 'Subject', key: 'subject', width: 32 },
      { header: 'Code', key: 'code', width: 10 },
      { header: 'Direction', key: 'direction', width: 22 },
      { header: 'Level', key: 'level', width: 10 },
      { header: 'Study type', key: 'studyType', width: 12 },
      { header: 'Term', key: 'term', width: 10 },
      { header: 'Course', key: 'course', width: 8 },
      { header: 'Semester', key: 'sem', width: 10 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Category', key: 'category', width: 14 },
      { header: 'Language', key: 'language', width: 10 },
      { header: 'Group', key: 'group', width: 12 },
      { header: 'Students', key: 'students', width: 10 },
      { header: 'Planned h', key: 'hours', width: 12 },
      { header: 'Formula', key: 'formula', width: 22 },
      { header: 'Teacher', key: 'teacher', width: 28 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    s.getRow(1).font = { bold: true };
    s.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' },
    };

    for (const i of items) {
      const row = s.addRow({
        subject: i.subjectOffering?.subject.name ?? '',
        code: i.subjectOffering?.subject.code ?? '',
        direction: i.subjectOffering?.subject.direction
          ? `${i.subjectOffering.subject.direction.code} — ${i.subjectOffering.subject.direction.name}`
          : '',
        level: i.subjectOffering?.subject.level ?? '',
        studyType: i.subjectOffering?.studyType ?? '',
        term: i.subjectOffering?.academicTerm ?? '',
        course: i.subjectOffering?.courseYear ?? '',
        sem: i.subjectOffering?.semesterNumber ?? '',
        type: i.workloadType,
        category: i.category,
        language: i.lectureStream?.language ?? i.group?.language ?? '',
        group: i.group?.name ?? '',
        students: i.studentCount,
        hours: i.plannedHours,
        formula: i.formulaConfig?.name ?? '',
        teacher: i.assignedTeacher?.fullName ?? '',
        status: i.status,
      });

      // Highlight unassigned items
      if (i.status === 'unassigned') {
        row.getCell('status').font = {
          color: { argb: 'FFB42318' },
          bold: true,
        };
      }
      if (i.status === 'invalid') {
        row.getCell('status').font = {
          color: { argb: 'FFB42318' },
          bold: true,
        };
      }
      if (i.requiresDegree && i.assignedTeacher && !i.assignedTeacher.hasScientificDegree) {
        row.getCell('teacher').font = { color: { argb: 'FFB42318' } };
      }
    }

    s.autoFilter = { from: 'A1', to: { row: 1, column: s.columns.length } };
    s.views = [{ state: 'frozen', ySplit: 1 }];
  }
}
