import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...ADMIN_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const moduleParam = searchParams.get('module') || '';
  const actionParam = searchParams.get('action') || '';

  const where: Record<string, unknown> = {};
  if (moduleParam) where.module = moduleParam;
  if (actionParam) where.action = actionParam;

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  });

  const rows = logs.map((l, idx) => ({
    No: idx + 1,
    'Waktu Kejadian': new Date(l.createdAt).toLocaleString('id-ID'),
    Modul: l.module,
    Aksi: l.action,
    Deskripsi: l.description,
    Pengguna: l.user?.username || 'Sistem',
    'Email Pengguna': l.user?.email || '-',
    Peran: l.roleName || '-',
    'IP Address': l.ipAddress || 'localhost',
    'User Agent': l.userAgent || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log Keamanan');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
