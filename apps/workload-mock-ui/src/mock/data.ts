import type {
  Group,
  MockStore,
  Stream,
  Subject,
  Teacher,
  WorkloadAssignment,
} from '@/types';
import { KIND_CATEGORY } from '@/types';

const teachers: Teacher[] = [
  {
    id: 't1',
    name: 'Aliyev Bobur Komilovich',
    degree: 'PhD',
    annualNorm: 900,
    position: 'Dotsent · Informatika',
    departmentId: 'cs',
  },
  {
    id: 't2',
    name: 'Karimova Malika Ibrohimovna',
    degree: 'Magistr',
    annualNorm: 720,
    position: "Katta o'qituvchi · Informatika",
    departmentId: 'cs',
  },
  {
    id: 't3',
    name: 'Toshmatov Javlon Ergashevich',
    degree: 'PhD',
    annualNorm: 900,
    position: 'Dotsent · Matematika',
    departmentId: 'cs',
  },
  {
    id: 't4',
    name: 'Rahimova Shahnoza Yusupovna',
    degree: 'Magistr',
    annualNorm: 720,
    position: "O'qituvchi · Informatika",
    departmentId: 'cs',
  },
  {
    id: 't5',
    name: "Yusupov Sanjar Baxtiyor o'g'li",
    degree: 'Magistr',
    annualNorm: 720,
    position: "Katta o'qituvchi · Matematika",
    departmentId: 'cs',
  },
  {
    id: 't6',
    name: 'Nazarova Gulnora Hamidovna',
    degree: 'Magistr',
    annualNorm: 720,
    position: "O'qituvchi · Informatika",
    departmentId: 'cs',
  },
  {
    id: 't7',
    name: 'Xasanov Ilhom Baxtiyorovich',
    degree: 'PhD',
    annualNorm: 900,
    position: 'Professor · Matematika',
    departmentId: 'cs',
  },
  {
    id: 't8',
    name: "Mirzayev Doniyor Sherzod o'g'li",
    degree: 'Magistr',
    annualNorm: 720,
    position: "O'qituvchi · Informatika",
    departmentId: 'cs',
  },
  {
    id: 't10',
    name: 'Sattorova Madina Alisherovna',
    degree: 'PhD',
    annualNorm: 720,
    position: 'Dotsent · Informatika',
    departmentId: 'cs',
  },
];

const subjects: Subject[] = [
  { id: 's1', name: 'Algoritmlar nazariyasi', code: 'CS201' },
  { id: 's2', name: 'Dasturlash asoslari', code: 'CS101' },
  { id: 's3', name: 'Dasturiy ta’minot injiniring', code: 'CS302' },
  { id: 's4', name: 'Kompyuter tarmoqlari', code: 'CS401' },
  { id: 's5', name: 'Sun’iy intellekt', code: 'CS450' },
];

const groups: Group[] = [
  { id: 'g1', name: 'CS-101', language: 'uz', studentCount: 28 },
  { id: 'g2', name: 'CS-102', language: 'uz', studentCount: 28 },
  { id: 'g3', name: 'IS-101', language: 'uz', studentCount: 15 },
  { id: 'g4', name: 'IS-102', language: 'ru', studentCount: 18 },
  { id: 'g5', name: 'CS-201', language: 'uz', studentCount: 30 },
];

const streams: Stream[] = [
  { id: 'st1', name: 'CS-101 + CS-102 oqimi', subjectId: 's1', studentCount: 56 },
  { id: 'st2', name: 'IS-101 + IS-102 oqimi', subjectId: 's2', studentCount: 33 },
  { id: 'st3', name: 'CS-201 oqimi', subjectId: 's4', studentCount: 30 },
];

function row(
  partial: Omit<WorkloadAssignment, 'id' | 'category' | 'isAuditorium'>,
  id: string,
): WorkloadAssignment {
  const category = KIND_CATEGORY[partial.kind];
  const isAuditorium = category === 'auditorium';
  return { ...partial, id, category, isAuditorium };
}

const assignments: WorkloadAssignment[] = [
  row(
    {
      teacherId: 't1',
      kind: 'lecture',
      semester: 'fall',
      subjectId: 's1',
      subjectName: 'Algoritmlar nazariyasi',
      groupOrStreamLabel: 'CS-101',
      students: 28,
      coefficient: 1,
      hours: 54,
    },
    'a1',
  ),
  row(
    {
      teacherId: 't1',
      kind: 'practice',
      semester: 'fall',
      subjectId: 's1',
      subjectName: 'Algoritmlar nazariyasi',
      groupOrStreamLabel: 'CS-101, CS-102',
      students: 56,
      coefficient: 1,
      hours: 72,
      groupIds: ['g1', 'g2'],
    },
    'a2',
  ),
  row(
    {
      teacherId: 't1',
      kind: 'control',
      semester: 'fall',
      subjectId: 's2',
      subjectName: 'Dasturlash asoslari',
      groupOrStreamLabel: '—',
      students: 25,
      coefficient: 0.72,
      hours: 18,
    },
    'a3',
  ),
  row(
    {
      teacherId: 't1',
      kind: 'vqr_day',
      semester: 'spring',
      subjectId: 's5',
      subjectName: 'Sun’iy intellekt',
      groupOrStreamLabel: 'VQR (Kunduzgi)',
      students: 20,
      coefficient: 1.5,
      hours: 30,
    },
    'a4',
  ),
  row(
    {
      teacherId: 't1',
      kind: 'internship',
      semester: 'spring',
      subjectId: 's3',
      subjectName: 'Dasturiy ta’minot injiniring',
      groupOrStreamLabel: 'IS-101',
      students: 15,
      coefficient: 1.47,
      hours: 22,
      groupIds: ['g3'],
    },
    'a5',
  ),
  row(
    {
      teacherId: 't2',
      kind: 'lecture',
      semester: 'fall',
      subjectId: 's2',
      subjectName: 'Dasturlash asoslari',
      groupOrStreamLabel: 'IS-101 + IS-102 oqimi',
      students: 33,
      coefficient: 1,
      hours: 45,
    },
    'a6',
  ),
  row(
    {
      teacherId: 't2',
      kind: 'control',
      semester: 'fall',
      subjectId: 's2',
      subjectName: 'Dasturlash asoslari',
      groupOrStreamLabel: '—',
      students: 50,
      coefficient: 0.5,
      hours: 25,
    },
    'a7',
  ),
  row(
    {
      teacherId: 't3',
      kind: 'practice',
      semester: 'fall',
      subjectId: 's1',
      subjectName: 'Algoritmlar nazariyasi',
      groupOrStreamLabel: 'CS-201',
      students: 30,
      coefficient: 1,
      hours: 30,
      groupIds: ['g5'],
    },
    'a8',
  ),
  row(
    {
      teacherId: 't3',
      kind: 'individual_project',
      semester: 'fall',
      subjectId: 's3',
      subjectName: 'Dasturiy ta’minot injiniring',
      groupOrStreamLabel: 'IS-102',
      students: 18,
      coefficient: 0.4,
      hours: 7.2,
      groupIds: ['g4'],
    },
    'a9',
  ),
  row(
    {
      teacherId: 't4',
      kind: 'vqr_parttime',
      semester: 'spring',
      subjectId: 's4',
      subjectName: 'Kompyuter tarmoqlari',
      groupOrStreamLabel: 'VQR (Sirtqi)',
      students: 12,
      coefficient: 1.2,
      hours: 14.4,
    },
    'a10',
  ),
  row(
    {
      teacherId: 't4',
      kind: 'prediploma',
      semester: 'spring',
      subjectId: 's3',
      subjectName: 'Dasturiy ta’minot injiniring',
      groupOrStreamLabel: 'IS-102',
      students: 10,
      coefficient: 3,
      hours: 30,
      groupIds: ['g4'],
    },
    'a11',
  ),
  row(
    {
      teacherId: 't6',
      kind: 'scientific_pedagogical',
      semester: 'fall',
      subjectId: 's5',
      subjectName: 'Sun’iy intellekt',
      groupOrStreamLabel: 'Ilmiy-pedagogik',
      students: 2,
      coefficient: 150,
      hours: 300,
    },
    'a12',
  ),
  row(
    {
      teacherId: 't8',
      kind: 'phd_supervision_parttime',
      semester: 'fall',
      subjectId: 's5',
      subjectName: 'Sun’iy intellekt',
      groupOrStreamLabel: 'PhD (sirtqi)',
      students: 2,
      coefficient: 60,
      hours: 120,
    },
    'a13',
  ),
  row(
    {
      teacherId: 't10',
      kind: 'scientific_internship',
      semester: 'spring',
      subjectId: 's5',
      subjectName: 'Sun’iy intellekt',
      groupOrStreamLabel: 'Ilmiy stajyorlik',
      students: 1,
      coefficient: 120,
      hours: 120,
    },
    'a14',
  ),
];

const department = {
  totalDepartmentHours: 12800,
  assignedHours: 9120,
  remainingHours: 3680,
  teacherCount: teachers.length,
  unassignedWorkloadCount: 12,
};

export const initialStore: MockStore = {
  teachers,
  subjects,
  groups,
  streams,
  assignments,
  department,
};

export function getTeacherById(
  id: string,
  list: Teacher[] = teachers,
): Teacher | undefined {
  return list.find((t) => t.id === id);
}

export { teachers, subjects, groups, streams };
