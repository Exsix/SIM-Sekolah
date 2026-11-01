import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: {
      teacherSubject: {
        include: {
          teacher: { select: { name: true } },
        },
      },
      _count: {
        select: {
          schedules: true,
          gradeItems: true,
        },
      },
    },
  });

  const rows = subjects.map((sub, idx) => ({
    No: idx + 1,
    'Kode Mapel': sub.code,
    'Nama Mata Pelajaran': sub.name,
    Kategori: sub.category || 'Umum',
    Tingkat: sub.gradeLevel ? `Kelas ${sub.gradeLevel}` : 'Semua Tingkat',
    'Guru Pengampu': sub.teacherSubject.map((ts) => ts.teacher.name).join(', ') || 'Belum Ditentukan',
    'Jumlah Sesi Jadwal': sub._count.schedules,
    'Komponen Penilaian': sub._count.gradeItems,
    Status: sub.isActive ? 'Aktif' : 'Nonaktif',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mata Pelajaran');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="data-mata-pelajaran-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
