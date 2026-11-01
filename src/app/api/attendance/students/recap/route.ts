import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';

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
    include: {
      homeroomTeacher: { select: { id: true, name: true } },
    },
  });

  if (!targetClass) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  // Calculate start & end date of the month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Get active students
  const students = await prisma.student.findMany({
    where: {
      classId,
      status: 'AKTIF',
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      nis: true,
      nisn: true,
      name: true,
      gender: true,
      photoUrl: true,
    },
  });

  // Get all attendance records for this class in the month range
  const records = await prisma.studentAttendance.findMany({
    where: {
      classId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Get unique meeting dates
  const uniqueDatesSet = new Set<string>();
  records.forEach((r) => {
    uniqueDatesSet.add(r.date.toISOString().split('T')[0]);
  });
  const meetingDates = Array.from(uniqueDatesSet).sort();

  // Aggregate per student
  const studentStats = students.map((s) => {
    const studentRecords = records.filter((r) => r.studentId === s.id);
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let dispensasi = 0;

    studentRecords.forEach((r) => {
      if (r.status === 'HADIR') hadir++;
      else if (r.status === 'SAKIT') sakit++;
      else if (r.status === 'IZIN') izin++;
      else if (r.status === 'ALPA') alpa++;
      else if (r.status === 'DISPENSASI') dispensasi++;
    });

    const totalDays = meetingDates.length;
    const effectivePresent = hadir + dispensasi;
    const rate = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

    return {
      student: s,
      hadir,
      sakit,
      izin,
      alpa,
      dispensasi,
      totalRecorded: studentRecords.length,
      attendanceRate: rate,
    };
  });

  // Class overall average
  const totalStudents = studentStats.length;
  const overallAvg =
    totalStudents > 0
      ? Math.round(studentStats.reduce((acc, curr) => acc + curr.attendanceRate, 0) / totalStudents)
      : 0;

  return NextResponse.json({
    data: {
      class: {
        id: targetClass.id,
        name: targetClass.name,
        gradeLevel: targetClass.gradeLevel,
        homeroomTeacher: targetClass.homeroomTeacher?.name || '-',
      },
      period: {
        month,
        year,
        totalMeetingDays: meetingDates.length,
        meetingDates,
      },
      classAverageRate: overallAvg,
      recap: studentStats,
    },
  });
}
