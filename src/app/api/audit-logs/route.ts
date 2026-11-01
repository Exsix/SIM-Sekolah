import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...ADMIN_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const moduleParam = searchParams.get('module') || '';
  const actionParam = searchParams.get('action') || '';
  const roleNameParam = searchParams.get('roleName') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (moduleParam) where.module = moduleParam;
  if (actionParam) where.action = actionParam;
  if (roleNameParam) where.roleName = roleNameParam;

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Calculate start of today for today stats
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [logs, total, todayCount, allActions] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.activityLog.groupBy({
      by: ['action'],
      _count: { action: true },
    }),
  ]);

  const actionBreakdown: Record<string, number> = {};
  for (const a of allActions) {
    actionBreakdown[a.action] = a._count.action;
  }

  return NextResponse.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      totalLogs: total,
      todayLogs: todayCount,
      actionBreakdown,
    },
  });
}
