import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HomePage } from '@/pages/public/HomePage';
import { LoginPage } from '@/pages/public/LoginPage';
import { AcademicYearsPage } from '@/pages/admin/AcademicYearsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminTeacherProfilePage } from '@/pages/admin/AdminTeacherProfilePage';
import { TeachersPage } from '@/pages/admin/TeachersPage';
import { DirectionsPage } from '@/pages/admin/DirectionsPage';
import { GroupsPage } from '@/pages/admin/GroupsPage';
import { SubjectsPage } from '@/pages/admin/SubjectsPage';
import { SubjectOfferingsPage } from '@/pages/admin/SubjectOfferingsPage';
import { FormulasPage } from '@/pages/admin/FormulasPage';
import { LectureStreamsPage } from '@/pages/admin/LectureStreamsPage';
import { WorkloadPage } from '@/pages/admin/WorkloadPage';
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage';
import { TeacherProfilePage } from '@/pages/teacher/TeacherProfilePage';
import { ComingSoonPage } from '@/pages/common/ComingSoonPage';

const soon = (title: string) => <ComingSoonPage title={title} />;

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <PublicLayout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'academic-years', element: <AcademicYearsPage /> },
      { path: 'teachers/:id', element: <AdminTeacherProfilePage /> },
      { path: 'teachers', element: <TeachersPage /> },
      { path: 'directions', element: <DirectionsPage /> },
      { path: 'groups', element: <GroupsPage /> },
      { path: 'subjects', element: <SubjectsPage /> },
      { path: 'subject-offerings', element: <SubjectOfferingsPage /> },
      { path: 'formulas', element: <FormulasPage /> },
      { path: 'streams', element: <LectureStreamsPage /> },
      { path: 'workload', element: <WorkloadPage /> },
      { path: 'monitoring', element: <AdminDashboardPage /> },
      { path: 'statistics', element: soon('Statistics') },
      { path: 'reports', element: soon('Reports') },
      { path: 'audit-logs', element: soon('Audit logs') },
      { path: 'settings', element: soon('Settings') },
    ],
  },
  {
    path: '/teacher',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <TeacherLayout />
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <TeacherDashboardPage /> },
      { path: 'load', element: <TeacherDashboardPage /> },
      { path: 'statistics', element: soon('My statistics') },
      { path: 'profile', element: <TeacherProfilePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
