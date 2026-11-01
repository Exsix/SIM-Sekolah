import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { DayOfWeek } from '@prisma/client';
import { z } from 'zod';

const createScheduleSchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().min(1, 'Kelas wajib dipilih'),
  subjectId: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  teacherId: z.string().min(1, 'Guru pengajar wajib dipilih'),
  dayOfWeek: z.nativeEnum(DayOfWeek, {
    message: 'Hari wajib dipilih (SENIN - SABTU)',
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam mulai harus HH:mm (contoh: 07:30)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam selesai harus HH:mm (contoh: 09:00)'),
  room: z.string().max(50).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  const dayOfWeek = searchParams.get('dayOfWeek');
  const subjectId = searchParams.get('subjectId');
  let academicYearId = searchParams.get('academicYearId');

  // If no academic year specified, find active academic year
  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (activeYear) academicYearId = activeYear.id;
  }

  // If logged in as SISWA and no classId is requested, lock to their enrolled class
  let effectiveClassId = classId;
  if (session.role === 'SISWA') {
    const student = await prisma.student.findFirst({
      where: { userId: session.id },
      select: { classId: true },
    });
    if (student?.classId) {
      effectiveClassId = student.classId;
    }
  }

  // If logged in as GURU and neither classId nor teacherId is requested, default to their teacherId
  let effectiveTeacherId = teacherId;
  if (session.role === 'GURU' && !effectiveClassId && !effectiveTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (teacher?.id) {
      effectiveTeacherId = teacher.id;
    }
  }

  const where: Record<string, unknown> = {};

  if (academicYearId) where.academicYearId = academicYearId;
  if (effectiveClassId) where.classId = effectiveClassId;
  if (effectiveTeacherId) where.teacherId = effectiveTeacherId;
  if (subjectId) where.subjectId = subjectId;
  if (dayOfWeek && Object.values(DayOfWeek).includes(dayOfWeek as DayOfWeek)) {
    where.dayOfWeek = dayOfWeek as DayOfWeek;
  }

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
    include: {
      class: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          major: true,
          room: true,
        },
      },
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          gradeLevel: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          nip: true,
          photoUrl: true,
        },
      },
      academicYear: {
        select: {
          id: true,
          name: true,
          semester: true,
        },
      },
      _count: {
        select: {
          attendances: true,
        },
      },
    },
  });

  return NextResponse.json({ data: schedules });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat menjadwalkan pelajaran' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Validate time logic
  if (data.startTime >= data.endTime) {
    return NextResponse.json(
      { error: 'Waktu selesai harus lebih besar daripada waktu mulai' },
      { status: 400 }
    );
  }

  // Resolve academic year
  let academicYearId = data.academicYearId;
  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) {
      return NextResponse.json({ error: 'Tahun akademik aktif tidak ditemukan' }, { status: 400 });
    }
    academicYearId = activeYear.id;
  }

  // 1. Check Teacher Conflict
  const teacherClashes = await prisma.schedule.findMany({
    where: {
      academicYearId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      AND: [
        { startTime: { lt: data.endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });

  if (teacherClashes.length > 0) {
    const clash = teacherClashes[0];
    return NextResponse.json(
      {
        error: `Bentrok Guru: Guru ${clash.teacher.name} sudah memiliki jadwal mengajar ${clash.subject.name} di kelas ${clash.class.name} pada hari ${data.dayOfWeek} pukul ${clash.startTime} - ${clash.endTime}`,
        conflictType: 'TEACHER',
      },
      { status: 409 }
    );
  }

  // 2. Check Class Conflict
  const classClashes = await prisma.schedule.findMany({
    where: {
      academicYearId,
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      AND: [
        { startTime: { lt: data.endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });

  if (classClashes.length > 0) {
    const clash = classClashes[0];
    return NextResponse.json(
      {
        error: `Bentrok Kelas: Kelas ${clash.class.name} sudah memiliki jadwal ${clash.subject.name} bersama ${clash.teacher.name} pada hari ${data.dayOfWeek} pukul ${clash.startTime} - ${clash.endTime}`,
        conflictType: 'CLASS',
      },
      { status: 409 }
    );
  }

  // 3. Check Room Conflict (if room specified)
  const roomTrimmed = data.room?.trim();
  if (roomTrimmed) {
    const roomClashes = await prisma.schedule.findMany({
      where: {
        academicYearId,
        room: { equals: roomTrimmed, mode: 'insensitive' },
        dayOfWeek: data.dayOfWeek,
        AND: [
          { startTime: { lt: data.endTime } },
          { endTime: { gt: data.startTime } },
        ],
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    if (roomClashes.length > 0) {
      const clash = roomClashes[0];
      return NextResponse.json(
        {
          error: `Bentrok Ruangan: Ruang "${roomTrimmed}" sudah digunakan oleh kelas ${clash.class.name} (${clash.subject.name}) pada hari ${data.dayOfWeek} pukul ${clash.startTime} - ${clash.endTime}`,
          conflictType: 'ROOM',
        },
        { status: 409 }
      );
    }
  }

  // Create Schedule
  const newSchedule = await prisma.schedule.create({
    data: {
      academicYearId,
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: roomTrimmed || null,
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true, code: true } },
      teacher: { select: { name: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'JADWAL',
      action: 'CREATE',
      recordId: newSchedule.id,
      description: `Menambahkan jadwal: ${newSchedule.subject.name} di ${newSchedule.class.name} (${newSchedule.dayOfWeek} ${newSchedule.startTime}-${newSchedule.endTime}) oleh ${newSchedule.teacher.name}`,
      newData: newSchedule as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: newSchedule }, { status: 201 });
}
