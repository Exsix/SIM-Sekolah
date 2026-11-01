import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { DayOfWeek } from '@prisma/client';
import * as XLSX from 'xlsx';

const DAY_LABELS: Record<string, string> = {
  SENIN: 'Senin',
  SELASA: 'Selasa',
  RABU: 'Rabu',
  KAMIS: 'Kamis',
  JUMAT: 'Jumat',
  SABTU: 'Sabtu',
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  let academicYearId = searchParams.get('academicYearId');

  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (activeYear) academicYearId = activeYear.id;
  }

  const where: Record<string, unknown> = {};
  if (academicYearId) where.academicYearId = academicYearId;
  if (classId) where.classId = classId;
  if (teacherId) where.teacherId = teacherId;

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
    include: {
      class: { select: { name: true, gradeLevel: true } },
      subject: { select: { name: true, code: true, category: true } },
      teacher: { select: { name: true, nip: true } },
      academicYear: { select: { name: true, semester: true } },
    },
  });

  const rows = schedules.map((s, idx) => ({
    No: idx + 1,
    Hari: DAY_LABELS[s.dayOfWeek] || s.dayOfWeek,
    'Jam Mulai': s.startTime,
    'Jam Selesai': s.endTime,
    Kelas: s.class.name,
    'Kode Mapel': s.subject.code,
    'Mata Pelajaran': s.subject.name,
    'Kategori Kurikulum': s.subject.category || 'Umum',
    'Guru Pengajar': s.teacher.name,
    'NIP Guru': s.teacher.nip || '-',
    Ruang: s.room || '-',
    'Tahun Ajaran': `${s.academicYear.name} (${s.academicYear.semester})`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Pelajaran');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="jadwal-pelajaran-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
