import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...STAFF_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const attendances = await prisma.teacherAttendance.findMany({
    where: { date: targetDate },
    orderBy: { teacher: { name: 'asc' } },
    include: {
      teacher: {
        select: {
          nip: true,
          name: true,
          position: true,
        },
      },
    },
  });

  const rows = attendances.map((a, idx) => ({
    No: idx + 1,
    'Nama Guru': a.teacher.name,
    NIP: a.teacher.nip,
    Jabatan: a.teacher.position || 'Guru Pengajar',
    Tanggal: new Date(a.date).toLocaleDateString('id-ID'),
    'Jam Masuk': a.checkInTime
      ? new Date(a.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-',
    'Jam Pulang': a.checkOutTime
      ? new Date(a.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-',
    Status: a.status,
    Catatan: a.notes || '-',
    Pencatat: a.recordedBy || 'Sistem',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Presensi Guru');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="presensi-guru-${targetDate.toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
