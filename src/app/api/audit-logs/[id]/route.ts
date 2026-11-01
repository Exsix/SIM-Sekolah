import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...ADMIN_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const log = await prisma.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: { select: { name: true } },
        },
      },
    },
  });

  if (!log) {
    return NextResponse.json({ error: 'Log aktivitas tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: log });
}
