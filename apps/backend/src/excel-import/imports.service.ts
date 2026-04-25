import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { categoryOf, requiresScientificDegree, type WorkloadType } from '@awdms/shared';
import { $Enums, Prisma, type FormulaConfig } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateFormula } from '../workload/formula-engine';
import { AppCacheService } from '../common/app-cache.service';

const REQUIRED_COLUMNS = [
  'academicYear',
  'subjectName',
  'groupName',
  'studyType',
  'courseYear',
  'semesterNumber',
  'academicTerm',
  'workloadType',
  'studentCount',
] as const;

const PHD_CAPPED_TYPES: WorkloadType[] = [
  'MD',
  'NDP',
  'NS',
  'phd_supervision_fulltime',
  'phd_supervision_parttime',
  'scientific_pedagogical',
  'scientific_internship',
  'master_dissertation_supervision',
];

type ImportRow = {
  rowNumber: number;
  academicYear: string;
  subjectName: string;
  groupName: string;
  studyType: 'full_time' | 'part_time';
  courseYear: number;
  semesterNumber: number;
  academicTerm: 'fall' | 'spring';
  workloadType: WorkloadType;
  studentCount: number;
  formulaName?: string;
  plannedHours?: number;
  teacherEmail?: string;
};

type RowError = {
  rowNumber: number;
  column: string;
  code: string;
  message: string;
  suggestedFix: string;
};

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AppCacheService,
  ) {}

  async importWorkloadExcel(params: {
    file: Express.Multer.File;
    preview: boolean;
    overwrite: boolean;
    performedByUserId: string;
  }) {
    this.validateFile(params.file);
    const rows = await this.parseRows(new Uint8Array(params.file.buffer));
    const { validRows, errors } = await this.validateRows(rows);

    if (params.preview) {
      return {
        mode: 'preview',
        totalRows: rows.length,
        validRows: validRows.length,
        invalidRows: errors.length,
        errors,
      };
    }

    const result = await this.commitRows(
      validRows,
      params.overwrite,
      params.performedByUserId,
    );

    this.cache.invalidatePrefixes(['workload:list:', 'monitoring:']);
    return {
      mode: 'commit',
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: errors.length,
      ...result,
      errors,
    };
  }

  private validateFile(file: Express.Multer.File) {
    const isXlsx =
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!isXlsx && !file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Only .xlsx files are supported');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10 MB');
    }
  }

  private async parseRows(buffer: Uint8Array): Promise<ImportRow[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const worksheet = wb.getWorksheet('workload_items') ?? wb.worksheets[0];
    if (!worksheet) throw new BadRequestException('Workbook has no sheets');

    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as Array<string | number>;
    const headerMap = new Map<string, number>();
    headers.forEach((h, idx) => {
      if (!h || idx === 0) return;
      headerMap.set(String(h).trim(), idx);
    });

    for (const col of REQUIRED_COLUMNS) {
      if (!headerMap.has(col)) {
        throw new BadRequestException(`Missing required column: ${col}`);
      }
    }

    const rows: ImportRow[] = [];
    for (let r = 2; r <= worksheet.rowCount; r += 1) {
      const row = worksheet.getRow(r);
      if (this.isEmptyRow(row.values)) continue;
      rows.push({
        rowNumber: r,
        academicYear: this.readString(row, headerMap, 'academicYear'),
        subjectName: this.readString(row, headerMap, 'subjectName'),
        groupName: this.readString(row, headerMap, 'groupName'),
        studyType: this.readEnum<'full_time' | 'part_time'>(
          row,
          headerMap,
          'studyType',
          ['full_time', 'part_time'],
        ),
        courseYear: this.readInt(row, headerMap, 'courseYear'),
        semesterNumber: this.readInt(row, headerMap, 'semesterNumber'),
        academicTerm: this.readEnum<'fall' | 'spring'>(
          row,
          headerMap,
          'academicTerm',
          ['fall', 'spring'],
        ),
        workloadType: this.readWorkloadType(row, headerMap, 'workloadType'),
        studentCount: this.readInt(row, headerMap, 'studentCount'),
        formulaName: this.readOptionalString(row, headerMap, 'formulaName'),
        plannedHours: this.readOptionalNumber(row, headerMap, 'plannedHours'),
        teacherEmail: this.readOptionalString(row, headerMap, 'teacherEmail'),
      });
    }
    if (rows.length > 10_000) {
      throw new BadRequestException('Max 10,000 workload rows per import');
    }
    return rows;
  }

  private async validateRows(rows: ImportRow[]) {
    const errors: RowError[] = [];
    const validRows: ImportRow[] = [];
    const dedupe = new Set<string>();

    for (const row of rows) {
      const rowErrors: RowError[] = [];
      if (row.studentCount <= 0) {
        rowErrors.push(this.err(row.rowNumber, 'studentCount', 'INVALID_VALUE', 'studentCount must be a positive integer', 'Use a value greater than 0'));
      }
      if (PHD_CAPPED_TYPES.includes(row.workloadType) && row.studentCount > 3) {
        rowErrors.push(this.err(row.rowNumber, 'studentCount', 'MAX_STUDENTS_EXCEEDED', `${row.workloadType} allows at most 3 students`, 'Reduce studentCount to 3 or lower'));
      }
      if (
        (row.workloadType === 'VQR_full_time' ||
          row.workloadType === 'VQR_part_time') &&
        row.courseYear !== 4
      ) {
        rowErrors.push(this.err(row.rowNumber, 'courseYear', 'INVALID_COURSE', 'Bitiruv malakaviy ish faqat 4-kurs uchun', 'Set courseYear to 4'));
      }
      if (row.workloadType === 'internship' && row.courseYear !== 3) {
        rowErrors.push(this.err(row.rowNumber, 'courseYear', 'INVALID_COURSE', 'Ishlab chiqarish amaliyoti faqat 3-kurs uchun', 'Set courseYear to 3'));
      }
      if (row.workloadType === 'prediploma' && row.courseYear !== 4) {
        rowErrors.push(this.err(row.rowNumber, 'courseYear', 'INVALID_COURSE', 'Bitiruv oldi amaliyoti faqat 4-kurs uchun', 'Set courseYear to 4'));
      }
      if (
        row.workloadType === 'scientific_pedagogical' &&
        (row.semesterNumber < 1 || row.semesterNumber > 3)
      ) {
        rowErrors.push(this.err(row.rowNumber, 'semesterNumber', 'INVALID_SEMESTER', 'Ilmiy pedagogik ish faqat 1-3 semestrlar uchun', 'Use semesterNumber 1, 2, or 3'));
      }
      if (
        (row.workloadType === 'scientific_internship' ||
          row.workloadType === 'master_dissertation_supervision') &&
        row.semesterNumber !== 4
      ) {
        rowErrors.push(this.err(row.rowNumber, 'semesterNumber', 'INVALID_SEMESTER', 'Bu yuklama faqat 4-semestr uchun', 'Set semesterNumber to 4'));
      }
      const dedupeKey = `${row.academicYear}|${row.subjectName}|${row.groupName}|${row.workloadType}|${row.semesterNumber}`;
      if (dedupe.has(dedupeKey)) {
        rowErrors.push(this.err(row.rowNumber, 'workloadType', 'DUPLICATE_IN_FILE', 'Duplicate key in the same import file', 'Keep only one row per key (year+subject+group+type+semester)'));
      } else {
        dedupe.add(dedupeKey);
      }
      if (rowErrors.length > 0) errors.push(...rowErrors);
      else validRows.push(row);
    }
    return { validRows, errors };
  }

  private async commitRows(
    rows: ImportRow[],
    overwrite: boolean,
    performedByUserId: string,
  ) {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const ctx = await this.resolveRowContext(row);
      const wtype = row.workloadType as $Enums.WorkloadType;

      const existing = await this.prisma.workloadItem.findFirst({
        where: {
          academicYearId: ctx.academicYearId,
          subjectOfferingId: ctx.subjectOfferingId,
          groupId: ctx.groupId,
          workloadType: wtype,
        },
        select: { id: true },
      });

      const data: Prisma.WorkloadItemUncheckedCreateInput & {
        maxStudentsAllowed: number | null;
      } = {
        academicYearId: ctx.academicYearId,
        subjectOfferingId: ctx.subjectOfferingId,
        lectureStreamId: null,
        groupId: ctx.groupId,
        workloadType: wtype,
        category: categoryOf(row.workloadType) as $Enums.WorkloadCategory,
        academicTerm: row.academicTerm as $Enums.AcademicTerm,
        semesterNumber: row.semesterNumber,
        courseYear: row.courseYear,
        level: ctx.level,
        studyType: row.studyType as $Enums.StudyType,
        studentCount: row.studentCount,
        plannedHours: ctx.plannedHours,
        formulaConfigId: ctx.formulaId,
        requiresDegree: requiresScientificDegree(row.workloadType),
        maxStudentsAllowed: PHD_CAPPED_TYPES.includes(row.workloadType) ? 3 : null,
        assignedTeacherId: ctx.teacherId,
        status: (ctx.teacherId ? 'assigned' : 'unassigned') as $Enums.AssignmentStatus,
      };

      if (!existing) {
        await this.prisma.workloadItem.create({ data });
        created += 1;
      } else if (overwrite) {
        await this.prisma.workloadItem.update({
          where: { id: existing.id },
          data,
        });
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: 'workload',
        entityId: '00000000-0000-0000-0000-000000000000',
        action: 'create',
        oldValue: Prisma.JsonNull,
        newValue: {
          importRows: rows.length,
          overwrite,
          created,
          updated,
          skipped,
        },
        performedByUserId,
      },
    });

    return { created, updated, skipped };
  }

  private async resolveRowContext(row: ImportRow) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { name: row.academicYear },
      select: { id: true },
    });
    if (!academicYear) {
      throw new BadRequestException(
        `Row ${row.rowNumber}: academicYear "${row.academicYear}" not found`,
      );
    }

    const group = await this.prisma.group.findUnique({
      where: { name: row.groupName },
      select: { id: true, studentCount: true },
    });
    if (!group) {
      throw new BadRequestException(
        `Row ${row.rowNumber}: group "${row.groupName}" not found`,
      );
    }

    const subject = await this.prisma.subject.findFirst({
      where: { name: row.subjectName },
      select: { id: true, level: true },
    });
    if (!subject) {
      throw new BadRequestException(
        `Row ${row.rowNumber}: subject "${row.subjectName}" not found`,
      );
    }

    const offering = await this.prisma.subjectOffering.findFirst({
      where: {
        subjectId: subject.id,
        studyType: row.studyType,
        courseYear: row.courseYear,
        semesterNumber: row.semesterNumber,
        academicTerm: row.academicTerm,
      },
      select: { id: true },
    });
    if (!offering) {
      throw new BadRequestException(
        `Row ${row.rowNumber}: matching subject offering not found for "${row.subjectName}"`,
      );
    }
    if (
      (row.workloadType === 'scientific_pedagogical' ||
        row.workloadType === 'scientific_internship' ||
        row.workloadType === 'master_dissertation_supervision') &&
      subject.level !== 'master'
    ) {
      throw new BadRequestException(
        `Row ${row.rowNumber}: ${row.workloadType} requires master level`,
      );
    }

    let formula: FormulaConfig | null = null;
    if (row.formulaName) {
      formula = await this.prisma.formulaConfig.findFirst({
        where: { name: row.formulaName, isActive: true },
      });
      if (!formula) {
        throw new BadRequestException(
          `Row ${row.rowNumber}: formula "${row.formulaName}" not found`,
        );
      }
    }

    let teacherId: string | null = null;
    if (row.teacherEmail) {
      const user = await this.prisma.user.findUnique({
        where: { email: row.teacherEmail },
        include: { teacher: true },
      });
      if (!user?.teacher || !user.teacher.isActive) {
        throw new BadRequestException(
          `Row ${row.rowNumber}: teacher "${row.teacherEmail}" not found or inactive`,
        );
      }
      if (requiresScientificDegree(row.workloadType) && !user.teacher.hasScientificDegree) {
        throw new BadRequestException(
          `Row ${row.rowNumber}: ${row.workloadType} requires scientific degree`,
        );
      }
      teacherId = user.teacher.id;
    }

    const plannedHours =
      row.plannedHours ??
      (formula ? evaluateFormula(formula, row.studentCount, 1) : 0);

    return {
      academicYearId: academicYear.id,
      subjectOfferingId: offering.id,
      groupId: group.id,
      formulaId: formula?.id ?? null,
      plannedHours,
      teacherId,
      level: subject.level as $Enums.StudyLevel,
    };
  }

  private isEmptyRow(values: ExcelJS.CellValue[] | { [key: string]: ExcelJS.CellValue }) {
    return Object.values(values).every((v) => v === null || v === undefined || String(v).trim() === '');
  }

  private readString(row: ExcelJS.Row, map: Map<string, number>, column: string): string {
    const raw = row.getCell(map.get(column) as number).value;
    return String(raw ?? '').trim();
  }

  private readOptionalString(
    row: ExcelJS.Row,
    map: Map<string, number>,
    column: string,
  ): string | undefined {
    const idx = map.get(column);
    if (!idx) return undefined;
    const value = String(row.getCell(idx).value ?? '').trim();
    return value || undefined;
  }

  private readOptionalNumber(
    row: ExcelJS.Row,
    map: Map<string, number>,
    column: string,
  ): number | undefined {
    const idx = map.get(column);
    if (!idx) return undefined;
    const raw = row.getCell(idx).value;
    if (raw === null || raw === undefined || String(raw).trim() === '') return undefined;
    const num = Number(raw);
    return Number.isFinite(num) ? num : undefined;
  }

  private readInt(row: ExcelJS.Row, map: Map<string, number>, column: string): number {
    const raw = row.getCell(map.get(column) as number).value;
    const num = Number(raw);
    return Number.isFinite(num) ? Math.trunc(num) : 0;
  }

  private readEnum<T extends string>(
    row: ExcelJS.Row,
    map: Map<string, number>,
    column: string,
    allowed: readonly T[],
  ): T {
    const value = this.readString(row, map, column) as T;
    if (!allowed.includes(value)) {
      throw new BadRequestException(
        `Row ${row.number}: ${column} must be one of: ${allowed.join(', ')}`,
      );
    }
    return value;
  }

  private readWorkloadType(
    row: ExcelJS.Row,
    map: Map<string, number>,
    column: string,
  ): WorkloadType {
    const raw = this.readString(row, map, column);
    const mapped =
      raw === 'VQR' ? 'VQR_full_time' : (raw as WorkloadType);
    const allowed: WorkloadType[] = [
      'lecture',
      'practice',
      'lab',
      'control',
      'individual_project',
      'course_project',
      'internship',
      'prediploma',
      'VQR_full_time',
      'VQR_part_time',
      'MD',
      'NDP',
      'NS',
      'phd_supervision_fulltime',
      'phd_supervision_parttime',
      'scientific_pedagogical',
      'scientific_internship',
      'master_dissertation_supervision',
    ];
    if (!allowed.includes(mapped)) {
      throw new BadRequestException(
        `Row ${row.number}: workloadType "${raw}" is invalid (use VQR_full_time or VQR_part_time; legacy "VQR" in files maps to VQR_full_time)`,
      );
    }
    return mapped;
  }

  private err(
    rowNumber: number,
    column: string,
    code: string,
    message: string,
    suggestedFix: string,
  ): RowError {
    return { rowNumber, column, code, message, suggestedFix };
  }
}
