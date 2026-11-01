import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const roleName = searchParams.get('role');
  const isActive = searchParams.get('isActive');

  const where: Record<string, unknown> = {};

  if (roleName) {
    where.role = { name: roleName };
  }
  if (isActive !== null && isActive !== '') {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { teacher: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: { name: 'asc' } }, { username: 'asc' }],
    include: {
      role: { select: { id: true, name: true, description: true } },
      student: { select: { id: true, name: true, nis: true, class: { select: { name: true } } } },
      teacher: { select: { id: true, name: true, nip: true, position: true } },
      _count: {
        select: {
          activityLogs: true,
        },
      },
    },
  });

  return NextResponse.json({ data: users });
}
