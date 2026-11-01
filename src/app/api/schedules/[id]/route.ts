import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { DayOfWeek } from '@prisma/client';
import { z } from 'zod';

const updateScheduleSchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  room: z.string().max(50).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const schedule = await prisma.schedule.findUnique({
    where: { id },
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
          email: true,
          phone: true,
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

  if (!schedule) {
    return NextResponse.json({ error: 'Jadwal pelajaran tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: schedule });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat memperbarui jadwal' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.schedule.findUnique({
    where: { id },
    include: { class: true, subject: true, teacher: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Jadwal pelajaran tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const targetClassId = data.classId || existing.classId;
  const targetSubjectId = data.subjectId || existing.subjectId;
  const targetTeacherId = data.teacherId || existing.teacherId;
  const targetDayOfWeek = data.dayOfWeek || existing.dayOfWeek;
  const targetStartTime = data.startTime || existing.startTime;
  const targetEndTime = data.endTime || existing.endTime;
  const targetRoom = data.room !== undefined ? data.room?.trim() || null : existing.room;
  const targetAcademicYearId = data.academicYearId || existing.academicYearId;

  if (targetStartTime >= targetEndTime) {
    return NextResponse.json(
      { error: 'Waktu selesai harus lebih besar daripada waktu mulai' },
      { status: 400 }
    );
  }

  // 1. Check Teacher Conflict (excluding this schedule)
  const teacherClashes = await prisma.schedule.findMany({
    where: {
      id: { not: id },
      academicYearId: targetAcademicYearId,
      teacherId: targetTeacherId,
      dayOfWeek: targetDayOfWeek,
      AND: [
        { startTime: { lt: targetEndTime } },
        { endTime: { gt: targetStartTime } },
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
        error: `Bentrok Guru: Guru ${clash.teacher.name} sudah mengajar ${clash.subject.name} di kelas ${clash.class.name} pada hari ${targetDayOfWeek} pukul ${clash.startTime} - ${clash.endTime}`,
        conflictType: 'TEACHER',
      },
      { status: 409 }
    );
  }

  // 2. Check Class Conflict (excluding this schedule)
  const classClashes = await prisma.schedule.findMany({
    where: {
      id: { not: id },
      academicYearId: targetAcademicYearId,
      classId: targetClassId,
      dayOfWeek: targetDayOfWeek,
      AND: [
        { startTime: { lt: targetEndTime } },
        { endTime: { gt: targetStartTime } },
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
        error: `Bentrok Kelas: Kelas ${clash.class.name} sudah memiliki jadwal ${clash.subject.name} bersama ${clash.teacher.name} pada hari ${targetDayOfWeek} pukul ${clash.startTime} - ${clash.endTime}`,
        conflictType: 'CLASS',
      },
      { status: 409 }
    );
  }

  // 3. Check Room Conflict (if room specified)
  if (targetRoom) {
    const roomClashes = await prisma.schedule.findMany({
      where: {
        id: { not: id },
        academicYearId: targetAcademicYearId,
        room: { equals: targetRoom, mode: 'insensitive' },
        dayOfWeek: targetDayOfWeek,
        AND: [
          { startTime: { lt: targetEndTime } },
          { endTime: { gt: targetStartTime } },
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
          error: `Bentrok Ruangan: Ruang "${targetRoom}" sudah digunakan oleh kelas ${clash.class.name} (${clash.subject.name}) pada hari ${targetDayOfWeek} pukul ${clash.startTime} - ${clash.endTime}`,
          conflictType: 'ROOM',
        },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.schedule.update({
    where: { id },
    data: {
      classId: targetClassId,
      subjectId: targetSubjectId,
      teacherId: targetTeacherId,
      dayOfWeek: targetDayOfWeek,
      startTime: targetStartTime,
      endTime: targetEndTime,
      room: targetRoom,
      academicYearId: targetAcademicYearId,
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true, code: true } },
      teacher: { select: { name: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'JADWAL',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui jadwal: ${updated.subject.name} di ${updated.class.name} (${updated.dayOfWeek} ${updated.startTime}-${updated.endTime}) oleh ${updated.teacher.name}`,
      oldData: existing as object,
      newData: updated as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat menghapus jadwal' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.schedule.findUnique({
    where: { id },
    include: { class: true, subject: true, teacher: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Jadwal pelajaran tidak ditemukan' }, { status: 404 });
  }

  await prisma.schedule.delete({
    where: { id },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'JADWAL',
      action: 'DELETE',
      recordId: id,
      description: `Menghapus jadwal pelajaran: ${existing.subject.name} di kelas ${existing.class.name} (${existing.dayOfWeek} ${existing.startTime}-${existing.endTime})`,
      oldData: existing as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Jadwal pelajaran berhasil dihapus' });
}
