import type { UserRole } from '@awdms/shared';

export type JwtTokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;           // user id
  role: UserRole;
  teacherId: string | null;
  tokenVersion: number;  // §10.1 — invalidated on logout/password change
  type: JwtTokenType;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  teacherId: string | null;
  tokenVersion: number;
}
