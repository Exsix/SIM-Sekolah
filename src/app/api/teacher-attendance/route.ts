import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { AttendanceStatus } from '@prisma/client';
import { z } from 'zod';

const createAttendanceSchema = z.object({
  teacherId: z.string().min(1, 'Guru wajib dipilih'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  status: z.nativeEnum(AttendanceStatus),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');
  const teacherIdParam = searchParams.get('teacherId');
  const statusParam = searchParams.get('status');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateStr = dateParam || todayStr;
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  const [setting, teachers, attendances] = await Promise.all([
    prisma.schoolSetting.findFirst(),
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nip: true,
        position: true,
        phone: true,
      },
    }),
    prisma.teacherAttendance.findMany({
      where: {
        date: targetDate,
        ...(teacherIdParam ? { teacherId: teacherIdParam } : {}),
        ...(statusParam ? { status: statusParam as AttendanceStatus } : {}),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            nip: true,
            position: true,
          },
        },
      },
    }),
  ]);

  // Read attendance tolerance from settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attRules = setting?.attendanceRules as any;
  const toleranceMinutes = Number(attRules?.lateToleranceMinutes || 15);
  const defaultStartTime = String(attRules?.defaultStartTime || '07:00');
  const [startH, startM] = defaultStartTime.split(':').map(Number);
  const cutoffMinutes = (startH || 7) * 60 + (startM || 0) + toleranceMinutes;

  // Map each teacher to their attendance record
  const attendanceMap = new Map(attendances.map((a) => [a.teacherId, a]));

  const records = teachers.map((t) => {
    const att = attendanceMap.get(t.id);
    let isLate = false;
    let lateMinutes = 0;

    if (att && att.checkInTime) {
      const inTime = new Date(att.checkInTime);
      const minutesOfDay = inTime.getHours() * 60 + inTime.getMinutes();
      if (minutesOfDay > cutoffMinutes) {
        isLate = true;
        lateMinutes = minutesOfDay - ((startH || 7) * 60 + (startM || 0));
      }
    }

    return {
      teacher: t,
      attendance: att
        ? {
            id: att.id,
            status: att.status,
            checkInTime: att.checkInTime ? att.checkInTime.toISOString() : null,
            checkOutTime: att.checkOutTime ? att.checkOutTime.toISOString() : null,
            notes: att.notes,
            recordedBy: att.recordedBy,
            isLate,
            lateMinutes,
          }
        : null,
    };
  });

  // Calculate statistics
  const totalTeachers = teachers.length;
  let presentCount = 0;
  let lateCount = 0;
  let sickCount = 0;
  let permissionCount = 0;
  let dutyCount = 0;
  let alphaCount = 0;

  for (const r of records) {
    if (!r.attendance) {
      alphaCount++;
      continue;
    }
    const s = r.attendance.status;
    if (s === 'HADIR') {
      presentCount++;
      if (r.attendance.isLate) lateCount++;
    } else if (s === 'SAKIT') {
      sickCount++;
    } else if (s === 'IZIN') {
      permissionCount++;
    } else if (s === 'DISPENSASI') {
      dutyCount++;
    } else if (s === 'ALPA') {
      alphaCount++;
    }
  }

  const attendanceRate = totalTeachers > 0 ? Math.round(((presentCount + dutyCount) / totalTeachers) * 100) : 0;

  return NextResponse.json({
    date: targetDate.toISOString().split('T')[0],
    records,
    stats: {
      totalTeachers,
      presentCount,
      lateCount,
      sickCount,
      permissionCount,
      dutyCount,
      alphaCount,
      attendanceRate,
    },
    rules: {
      defaultStartTime,
      lateToleranceMinutes: toleranceMinutes,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createAttendanceSchema.parse(body);

    const targetDate = new Date(`${data.date}T00:00:00.000Z`);

    let checkIn: Date | null = null;
    let checkOut: Date | null = null;

    if (data.checkInTime) {
      const [h, m] = data.checkInTime.split(':').map(Number);
      checkIn = new Date(targetDate);
      checkIn.setHours(h, m, 0, 0);
    }

    if (data.checkOutTime) {
      const [h, m] = data.checkOutTime.split(':').map(Number);
      checkOut = new Date(targetDate);
      checkOut.setHours(h, m, 0, 0);
    }

    const saved = await prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId: data.teacherId,
          date: targetDate,
        },
      },
      update: {
        status: data.status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        notes: data.notes || null,
        recordedBy: session.username,
      },
      create: {
        teacherId: data.teacherId,
        date: targetDate,
        status: data.status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        notes: data.notes || null,
        recordedBy: session.username,
      },
      include: {
        teacher: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'ATTENDANCE',
        action: 'UPDATE',
        recordId: saved.id,
        description: `Mencatat presensi guru: ${saved.teacher.name} (${saved.status}) tanggal ${data.date}`,
        newData: JSON.parse(JSON.stringify(saved)),
        ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
        userAgent: req.headers.get('user-agent') || 'internal',
      },
    });

    return NextResponse.json({
      message: 'Presensi guru berhasil disimpan',
      data: saved,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Teacher attendance error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan presensi guru' }, { status: 500 });
  }
}
