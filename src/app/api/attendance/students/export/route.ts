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
  const classId = searchParams.get('classId');
  const now = new Date();
  const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString());
  const year = parseInt(searchParams.get('year') || now.getFullYear().toString());

  if (!classId) {
    return NextResponse.json({ error: 'Parameter classId wajib diisi' }, { status: 400 });
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    include: { homeroomTeacher: true },
  });

  if (!targetClass) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [students, records] = await Promise.all([
    prisma.student.findMany({
      where: { classId, status: 'AKTIF' },
      orderBy: { name: 'asc' },
    }),
    prisma.studentAttendance.findMany({
      where: { classId, date: { gte: startDate, lte: endDate } },
    }),
  ]);

  const uniqueDatesSet = new Set<string>();
  records.forEach((r) => uniqueDatesSet.add(r.date.toISOString().split('T')[0]));
  const totalDays = uniqueDatesSet.size;

  const rows = students.map((s, idx) => {
    const studentRecords = records.filter((r) => r.studentId === s.id);
    let hadir = 0, sakit = 0, izin = 0, alpa = 0, dispensasi = 0;

    studentRecords.forEach((r) => {
      if (r.status === 'HADIR') hadir++;
      else if (r.status === 'SAKIT') sakit++;
      else if (r.status === 'IZIN') izin++;
      else if (r.status === 'ALPA') alpa++;
      else if (r.status === 'DISPENSASI') dispensasi++;
    });

    const effectivePresent = hadir + dispensasi;
    const rate = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

    return {
      No: idx + 1,
      NIS: s.nis,
      NISN: s.nisn || '-',
      'Nama Lengkap Siswa': s.name,
      'Jenis Kelamin': s.gender === 'LAKI_LAKI' ? 'L' : 'P',
      'Hadir (H)': hadir,
      'Sakit (S)': sakit,
      'Izin (I)': izin,
      'Alpa (A)': alpa,
      'Dispensasi (D)': dispensasi,
      'Persentase Kehadiran': `${rate}%`,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${targetClass.name}`);

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const monthName = monthNames[month - 1] || month;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rekap-absensi-${targetClass.name.replace(/\s+/g, '_')}-${monthName}-${year}.xlsx"`,
    },
  });
}
