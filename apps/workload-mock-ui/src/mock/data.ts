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
    name: 'Dilshod Karimov',
    degree: 'PhD',
    annualNorm: 900,
    position: 'Professor',
    departmentId: 'cs',
  },
  {
    id: 't2',
    name: 'Nodira Toshmatova',
    degree: 'PhD',
    annualNorm: 720,
    position: 'Associate professor',
    departmentId: 'cs',
  },
  {
    id: 't3',
    name: 'Jamshid Rahimov',
    degree: 'NoDegree',
    annualNorm: 720,
    position: 'Senior lecturer',
    departmentId: 'cs',
  },
  {
    id: 't4',
    name: 'Malika Yusupova',
    degree: 'PhD',
    annualNorm: 900,
    position: 'Associate professor',
    departmentId: 'cs',
  },
  {
    id: 't5',
    name: 'Bobur Sattorov',
    degree: 'NoDegree',
    annualNorm: 540,
    position: 'Lecturer',
    departmentId: 'cs',
  },
  {
    id: 't6',
    name: 'Shahnoza Ilhomova',
    degree: 'PhD',
    annualNorm: 720,
    position: 'Professor',
    departmentId: 'cs',
  },
  {
    id: 't7',
    name: 'Sardor Nematov',
    degree: 'NoDegree',
    annualNorm: 720,
    position: 'Lecturer',
    departmentId: 'cs',
  },
  {
    id: 't8',
    name: 'Dildora Aripova',
    degree: 'PhD',
    annualNorm: 600,
    position: 'Assistant professor',
    departmentId: 'cs',
  },
  {
    id: 't9',
    name: 'Rustam Qo‘chqorov',
    degree: 'NoDegree',
    annualNorm: 540,
    position: 'Lecturer',
    departmentId: 'cs',
  },
  {
    id: 't10',
    name: 'Madina Ergasheva',
    degree: 'PhD',
    annualNorm: 720,
    position: 'Associate professor',
    departmentId: 'cs',
  },
];

const subjects: Subject[] = [
  { id: 's1', name: 'Data Structures & Algorithms', code: 'CS201' },
  { id: 's2', name: 'Database Systems', code: 'CS301' },
  { id: 's3', name: 'Software Engineering', code: 'CS302' },
  { id: 's4', name: 'Computer Networks', code: 'CS401' },
  { id: 's5', name: 'Artificial Intelligence', code: 'CS450' },
];

const groups: Group[] = [
  { id: 'g1', name: '321-A (UZ)', language: 'uz', studentCount: 28 },
  { id: 'g2', name: '321-B (RU)', language: 'ru', studentCount: 24 },
  { id: 'g3', name: '421-A (UZ)', language: 'uz', studentCount: 22 },
  { id: 'g4', name: '521-M (RU)', language: 'ru', studentCount: 18 },
  { id: 'g5', name: '320-A (UZ)', language: 'uz', studentCount: 30 },
];

const streams: Stream[] = [
  { id: 'st1', name: 'Lecture stream A — DSA', subjectId: 's1', studentCount: 90 },
  { id: 'st2', name: 'Lecture stream B — DB', subjectId: 's2', studentCount: 70 },
  { id: 'st3', name: 'Networks combined', subjectId: 's4', studentCount: 45 },
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
      subjectName: 'Data Structures & Algorithms',
      groupOrStreamLabel: 'Lecture stream A — DSA',
      students: 90,
      coefficient: 1,
      hours: 60,
    },
    'a1',
  ),
  row(
    {
      teacherId: 't1',
      kind: 'practice',
      semester: 'fall',
      subjectId: 's1',
      subjectName: 'Data Structures & Algorithms',
      groupOrStreamLabel: '321-A, 321-B',
      students: 52,
      coefficient: 1,
      hours: 36,
      groupIds: ['g1', 'g2'],
    },
    'a2',
  ),
  row(
    {
      teacherId: 't1',
      kind: 'phd_supervision_fulltime',
      semester: 'fall',
      subjectId: 's5',
      subjectName: 'Artificial Intelligence',
      groupOrStreamLabel: 'PhD cohort',
      students: 2,
      coefficient: 100,
      hours: 200,
    },
    'a3',
  ),
  row(
    {
      teacherId: 't2',
      kind: 'lecture',
      semester: 'fall',
      subjectId: 's2',
      subjectName: 'Database Systems',
      groupOrStreamLabel: 'Lecture stream B — DB',
      students: 70,
      coefficient: 1,
      hours: 45,
    },
    'a4',
  ),
  row(
    {
      teacherId: 't2',
      kind: 'control',
      semester: 'fall',
      subjectId: 's2',
      subjectName: 'Database Systems',
      groupOrStreamLabel: 'Exam / mixed',
      students: 50,
      coefficient: 0.5,
      hours: 25,
    },
    'a5',
  ),
  row(
    {
      teacherId: 't3',
      kind: 'practice',
      semester: 'fall',
      subjectId: 's1',
      subjectName: 'Data Structures & Algorithms',
      groupOrStreamLabel: '320-A (UZ)',
      students: 30,
      coefficient: 1,
      hours: 30,
      groupIds: ['g5'],
    },
    'a6',
  ),
  row(
    {
      teacherId: 't3',
      kind: 'individual_project',
      semester: 'fall',
      subjectId: 's3',
      subjectName: 'Software Engineering',
      groupOrStreamLabel: '321-A (UZ)',
      students: 12,
      coefficient: 0.4,
      hours: 4.8,
      groupIds: ['g1'],
    },
    'a7',
  ),
  row(
    {
      teacherId: 't4',
      kind: 'vqr_day',
      semester: 'fall',
      subjectId: 's4',
      subjectName: 'Computer Networks',
      groupOrStreamLabel: 'VQR block',
      students: 1,
      coefficient: 40,
      hours: 40,
    },
    'a8',
  ),
  row(
    {
      teacherId: 't4',
      kind: 'internship',
      semester: 'spring',
      subjectId: 's3',
      subjectName: 'Software Engineering',
      groupOrStreamLabel: '421-A (UZ)',
      students: 20,
      coefficient: 1,
      hours: 40,
      groupIds: ['g3'],
    },
    'a9',
  ),
  row(
    {
      teacherId: 't5',
      kind: 'lecture',
      semester: 'fall',
      subjectId: 's1',
      subjectName: 'Data Structures & Algorithms',
      groupOrStreamLabel: 'Lecture stream A — DSA',
      students: 0,
      coefficient: 1,
      hours: 0,
    },
    'a10',
  ),
  row(
    {
      teacherId: 't6',
      kind: 'scientific_pedagogical',
      semester: 'fall',
      subjectId: 's5',
      subjectName: 'Artificial Intelligence',
      groupOrStreamLabel: 'Faculty R&D',
      students: 1,
      coefficient: 30,
      hours: 30,
    },
    'a11',
  ),
  row(
    {
      teacherId: 't6',
      kind: 'prediploma',
      semester: 'spring',
      subjectId: 's3',
      subjectName: 'Software Engineering',
      groupOrStreamLabel: '521-M (RU)',
      students: 10,
      coefficient: 1,
      hours: 30,
      groupIds: ['g4'],
    },
    'a12',
  ),
  row(
    {
      teacherId: 't7',
      kind: 'practice',
      semester: 'fall',
      subjectId: 's4',
      subjectName: 'Computer Networks',
      groupOrStreamLabel: '321-B (RU), 421-A (UZ)',
      students: 46,
      coefficient: 1,
      hours: 60,
      groupIds: ['g2', 'g3'],
    },
    'a13',
  ),
  row(
    {
      teacherId: 't8',
      kind: 'phd_supervision_parttime',
      semester: 'fall',
      subjectId: 's5',
      subjectName: 'Artificial Intelligence',
      groupOrStreamLabel: 'PhD (part-time)',
      students: 2,
      coefficient: 60,
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
