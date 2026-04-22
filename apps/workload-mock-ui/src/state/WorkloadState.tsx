import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { initialStore } from '@/mock/data';
import type { Teacher, WorkloadAssignment } from '@/types';
import { KIND_CATEGORY, KIND_LABEL } from '@/types';

export interface WorkloadStateValue {
  teachers: Teacher[];
  assignments: WorkloadAssignment[];
  department: (typeof initialStore)['department'];
  subjects: (typeof initialStore)['subjects'];
  groups: (typeof initialStore)['groups'];
  streams: (typeof initialStore)['streams'];
  addAssignment: (a: Omit<WorkloadAssignment, 'id' | 'category' | 'isAuditorium'>) => void;
  /** Simulate loading (demo) */
  globalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;
}

const WorkloadContext = createContext<WorkloadStateValue | null>(null);

let idSeq = 1000;
function nextId() {
  idSeq += 1;
  return `a${idSeq}`;
}

export function WorkloadProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<WorkloadAssignment[]>(
    () => initialStore.assignments,
  );
  const [globalLoading, setGlobalLoading] = useState(false);

  const addAssignment = useCallback(
    (a: Omit<WorkloadAssignment, 'id' | 'category' | 'isAuditorium'>) => {
      const id = nextId();
      const category = KIND_CATEGORY[a.kind];
      const isAuditorium = category === 'auditorium';
      setAssignments((prev) => [
        ...prev,
        { ...a, id, category, isAuditorium },
      ]);
    },
    [],
  );

  const value = useMemo<WorkloadStateValue>(
    () => ({
      teachers: initialStore.teachers,
      assignments,
      department: initialStore.department,
      subjects: initialStore.subjects,
      groups: initialStore.groups,
      streams: initialStore.streams,
      addAssignment,
      globalLoading,
      setGlobalLoading,
    }),
    [assignments, addAssignment, globalLoading],
  );

  return (
    <WorkloadContext.Provider value={value}>{children}</WorkloadContext.Provider>
  );
}

export function useWorkloadState() {
  const ctx = useContext(WorkloadContext);
  if (!ctx) {
    throw new Error('useWorkloadState must be used within WorkloadProvider');
  }
  return ctx;
}

export function teacherStats(
  teacherId: string,
  assignments: WorkloadAssignment[],
) {
  const mine = assignments.filter((a) => a.teacherId === teacherId);
  const auditorium = mine.filter((a) => a.isAuditorium).reduce((s, a) => s + a.hours, 0);
  const non = mine
    .filter((a) => !a.isAuditorium)
    .reduce((s, a) => s + a.hours, 0);
  const total = auditorium + non;
  return { total, auditorium, nonAuditorium: non, count: mine.length };
}

export function recentAssignments(
  assignments: WorkloadAssignment[],
  teachers: Teacher[],
  take = 6,
) {
  const tmap = new Map(teachers.map((t) => [t.id, t.name]));
  return [...assignments]
    .slice(-take)
    .reverse()
    .map((a) => ({
      id: a.id,
      label: KIND_LABEL[a.kind],
      teacherName: tmap.get(a.teacherId) ?? a.teacherId,
      hours: a.hours,
      subject: a.subjectName,
    }));
}

