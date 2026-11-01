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
  const status = searchParams.get('status') || '';
  const isActive = searchParams.get('isActive') || '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nip: { contains: search, mode: 'insensitive' } },
      { nuptk: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.employmentStatus = status;
  if (isActive !== '') where.isActive = isActive === 'true';

  const teachers = await prisma.teacher.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      classesAdvised: { select: { name: true } },
      teacherSubjects: {
        include: { subject: { select: { name: true } } },
        take: 5,
      },
    },
  });

  const rows = teachers.map((t, i) => ({
    No: i + 1,
    NIP: t.nip || '-',
    NUPTK: t.nuptk || '-',
    'Nama Lengkap': t.name,
    'Jenis Kelamin': t.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
    'Jabatan / Tugas': t.position || '-',
    'Status Kepegawaian': t.employmentStatus.replace('_', ' '),
    Pendidikan: t.education || '-',
    'Tgl Bergabung': t.joinDate ? t.joinDate.toISOString().split('T')[0] : '-',
    'No. Telepon': t.phone || '-',
    Email: t.email || '-',
    'Wali Kelas': t.classesAdvised.map((c) => c.name).join(', ') || '-',
    'Mata Pelajaran': t.teacherSubjects.map((ts) => ts.subject.name).join(', ') || '-',
    Status: t.isActive ? 'Aktif' : 'Tidak Aktif',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="data-guru-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
