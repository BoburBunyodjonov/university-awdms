import type {
  AssignmentStatus,
  StreamStatus,
  UserRole,
  ViewMode,
} from '../types/enums';

// Section 9.5 status color codes — single source for backend reports
// (e.g. Excel cell highlights) and frontend badges.
// Values are Tailwind color tokens from the default palette.
export const STATUS_COLOR: Record<
  AssignmentStatus | StreamStatus,
  { label: string; bg: string; text: string; border: string; hex: string }
> = {
  assigned: {
    label: 'Assigned',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    hex: '#10b981',
  },
  unassigned: {
    label: 'Unassigned',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    hex: '#ef4444',
  },
  invalid: {
    label: 'Invalid',
    bg: 'bg-red-200',
    text: 'text-red-900',
    border: 'border-red-500',
    hex: '#991b1b',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-zinc-100',
    text: 'text-zinc-800',
    border: 'border-zinc-300',
    hex: '#71717a',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    hex: '#3b82f6',
  },
};

// Section 9.6 view modes for workload tables.
export const VIEW_MODES: readonly ViewMode[] = [
  'flat',
  'by_teacher',
  'by_semester',
  'by_category',
  'by_stream',
] as const;

// Section 3 user roles.
export const ALL_ROLES: readonly UserRole[] = [
  'admin',
  'teacher',
  'student',
  'guest',
] as const;

// Handy lookup: which roles have access to admin routes.
export const ADMIN_ROLES: readonly UserRole[] = ['admin'] as const;
