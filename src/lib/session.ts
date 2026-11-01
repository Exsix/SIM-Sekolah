import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  username: string;
  role: string;
  name: string;
  studentId?: string | null;
  teacherId?: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('sim_session');
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value) as SessionUser;
  } catch {
    return null;
  }
}

export function requireRoles(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'];
