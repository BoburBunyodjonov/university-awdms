import type { ReactNode } from 'react';
import type { UserRole } from '@awdms/shared';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface RoleGuardProps {
  allow: readonly UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allow, children, fallback }: RoleGuardProps) {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return null;
  if (!user || !allow.includes(user.role)) {
    return (
      fallback ?? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-red-700">
            403 — Access denied
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            You do not have permission to view this page.
          </p>
        </div>
      )
    );
  }
  return <>{children}</>;
}
