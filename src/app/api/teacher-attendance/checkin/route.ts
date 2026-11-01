import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { AttendanceStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find user's linked teacher record
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { teacher: true },
  });

  if (!user?.teacher) {
    return NextResponse.json(
      { error: 'Akun Anda tidak terhubung dengan data guru/tenaga pendidik' },
      { status: 400 }
    );
  }

  const teacherId = user.teacher.id;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const today = new Date(`${todayStr}T00:00:00.000Z`);

  // Check existing attendance for today
  const existing = await prisma.teacherAttendance.findUnique({
    where: {
      teacherId_date: {
        teacherId,
        date: today,
      },
    },
  });

  // Read school settings for cutoff
  const setting = await prisma.schoolSetting.findFirst();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attRules = setting?.attendanceRules as any;
  const toleranceMinutes = Number(attRules?.lateToleranceMinutes || 15);
  const defaultStartTime = String(attRules?.defaultStartTime || '07:00');
  const [startH, startM] = defaultStartTime.split(':').map(Number);
  const cutoffMinutes = (startH || 7) * 60 + (startM || 0) + toleranceMinutes;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isLate = currentMinutes > cutoffMinutes;
  const lateMinutes = isLate ? currentMinutes - ((startH || 7) * 60 + (startM || 0)) : 0;

  let result;
  let actionType: 'CHECKIN' | 'CHECKOUT' = 'CHECKIN';

  if (!existing || !existing.checkInTime) {
    // Perform Check-in
    actionType = 'CHECKIN';
    result = await prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId,
          date: today,
        },
      },
      update: {
        checkInTime: now,
        status: AttendanceStatus.HADIR,
        notes: isLate ? `Terlambat ${lateMinutes} menit (Check-in Mandiri)` : 'Check-in Mandiri (Tepat Waktu)',
        recordedBy: `${user.username} (Mandiri)`,
      },
      create: {
        teacherId,
        date: today,
        checkInTime: now,
        status: AttendanceStatus.HADIR,
        notes: isLate ? `Terlambat ${lateMinutes} menit (Check-in Mandiri)` : 'Check-in Mandiri (Tepat Waktu)',
        recordedBy: `${user.username} (Mandiri)`,
      },
    });
  } else {
    // Perform Check-out
    actionType = 'CHECKOUT';
    result = await prisma.teacherAttendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime: now,
      },
    });
  }

  // Activity Log
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'ATTENDANCE',
      action: 'UPDATE',
      recordId: result.id,
      description: `Guru ${user.teacher.name} melakukan ${actionType === 'CHECKIN' ? 'Check-in Jam Masuk' : 'Check-out Jam Pulang'} mandiri`,
      newData: JSON.parse(JSON.stringify(result)),
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    message: actionType === 'CHECKIN' ? 'Check-in berhasil dicatat' : 'Check-out berhasil dicatat',
    actionType,
    data: result,
  });
}
