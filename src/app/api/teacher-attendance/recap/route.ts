import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...STAFF_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month'); // 1-12
  const yearParam = searchParams.get('year'); // e.g. 2026

  const now = new Date();
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();

  // First day and last day of month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [teachers, attendances, setting] = await Promise.all([
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nip: true,
        position: true,
      },
    }),
    prisma.teacherAttendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.schoolSetting.findFirst(),
  ]);

  // Read school settings for cutoff
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attRules = setting?.attendanceRules as any;
  const toleranceMinutes = Number(attRules?.lateToleranceMinutes || 15);
  const defaultStartTime = String(attRules?.defaultStartTime || '07:00');
  const [startH, startM] = defaultStartTime.split(':').map(Number);
  const cutoffMinutes = (startH || 7) * 60 + (startM || 0) + toleranceMinutes;

  // Group attendances by teacherId
  const attendanceByTeacher = new Map<string, typeof attendances>();
  for (const a of attendances) {
    const list = attendanceByTeacher.get(a.teacherId) || [];
    list.push(a);
    attendanceByTeacher.set(a.teacherId, list);
  }

  const recap = teachers.map((teacher) => {
    const list = attendanceByTeacher.get(teacher.id) || [];

    let hadirCount = 0;
    let lateCount = 0;
    let lateMinutesTotal = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let dutyCount = 0; // DISPENSASI
    let alpaCount = 0;

    for (const a of list) {
      if (a.status === 'HADIR') {
        hadirCount++;
        if (a.checkInTime) {
          const inTime = new Date(a.checkInTime);
          const minutesOfDay = inTime.getHours() * 60 + inTime.getMinutes();
          if (minutesOfDay > cutoffMinutes) {
            lateCount++;
            lateMinutesTotal += (minutesOfDay - ((startH || 7) * 60 + (startM || 0)));
          }
        }
      } else if (a.status === 'SAKIT') {
        sakitCount++;
      } else if (a.status === 'IZIN') {
        izinCount++;
      } else if (a.status === 'DISPENSASI') {
        dutyCount++;
      } else if (a.status === 'ALPA') {
        alpaCount++;
      }
    }

    const recordedDays = list.length;
    const effectivePresent = hadirCount + dutyCount;
    const percentage = recordedDays > 0 ? Math.round((effectivePresent / recordedDays) * 100) : 0;

    // Discipline rating
    let rating: 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'PERLU_PEMBINAAN' = 'SANGAT_BAIK';
    if (percentage < 75 || alpaCount >= 3) {
      rating = 'PERLU_PEMBINAAN';
    } else if (percentage < 85 || lateCount >= 4) {
      rating = 'CUKUP';
    } else if (percentage < 95 || lateCount >= 2) {
      rating = 'BAIK';
    }

    return {
      teacher,
      stats: {
        recordedDays,
        hadirCount,
        lateCount,
        lateMinutesTotal,
        sakitCount,
        izinCount,
        dutyCount,
        alpaCount,
        percentage,
        rating,
      },
    };
  });

  return NextResponse.json({
    month,
    year,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    recap,
  });
}
