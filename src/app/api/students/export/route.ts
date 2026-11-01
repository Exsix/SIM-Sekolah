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
  const classId = searchParams.get('classId') || '';
  const status = searchParams.get('status') || '';
  const entryYear = searchParams.get('entryYear') || '';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nis: { contains: search, mode: 'insensitive' } },
      { nisn: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (classId) where.classId = classId;
  if (status) where.status = status;
  if (entryYear) where.entryYear = parseInt(entryYear);

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
    include: {
      class: { select: { name: true } },
    },
  });

  const rows = students.map((s, index) => ({
    No: index + 1,
    NIS: s.nis,
    NISN: s.nisn || '-',
    'Nama Lengkap': s.name,
    'Jenis Kelamin': s.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
    Kelas: s.class?.name || 'Belum Ada',
    'Tempat Lahir': s.birthPlace || '-',
    'Tanggal Lahir': s.birthDate ? s.birthDate.toISOString().split('T')[0] : '-',
    Agama: s.religion || '-',
    'No. Telepon/WA': s.phone || '-',
    Email: s.email || '-',
    Alamat: s.address || '-',
    'Tahun Masuk': s.entryYear,
    Status: s.status,
    Catatan: s.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="data-siswa-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
