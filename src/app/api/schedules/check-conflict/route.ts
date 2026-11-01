import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { DayOfWeek } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    academicYearId?: string;
    classId?: string;
    teacherId?: string;
    dayOfWeek?: DayOfWeek;
    startTime?: string;
    endTime?: string;
    room?: string | null;
    excludeScheduleId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const {
    classId,
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    room,
    excludeScheduleId,
  } = body;

  let academicYearId = body.academicYearId;
  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (activeYear) academicYearId = activeYear.id;
  }

  if (!dayOfWeek || !startTime || !endTime || startTime >= endTime) {
    return NextResponse.json({ hasConflict: false, conflicts: [] });
  }

  const conflicts: Array<{ type: 'TEACHER' | 'CLASS' | 'ROOM'; message: string }> = [];

  const timeCondition = {
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } },
    ],
  };

  // 1. Teacher conflict check
  if (teacherId) {
    const teacherClashes = await prisma.schedule.findMany({
      where: {
        academicYearId,
        teacherId,
        dayOfWeek,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
        ...timeCondition,
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    for (const c of teacherClashes) {
      conflicts.push({
        type: 'TEACHER',
        message: `Guru ${c.teacher.name} sudah mengajar ${c.subject.name} di ${c.class.name} (${c.startTime} - ${c.endTime})`,
      });
    }
  }

  // 2. Class conflict check
  if (classId) {
    const classClashes = await prisma.schedule.findMany({
      where: {
        academicYearId,
        classId,
        dayOfWeek,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
        ...timeCondition,
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    for (const c of classClashes) {
      conflicts.push({
        type: 'CLASS',
        message: `Kelas ${c.class.name} sudah memiliki jadwal ${c.subject.name} bersama ${c.teacher.name} (${c.startTime} - ${c.endTime})`,
      });
    }
  }

  // 3. Room conflict check
  const roomTrimmed = room?.trim();
  if (roomTrimmed) {
    const roomClashes = await prisma.schedule.findMany({
      where: {
        academicYearId,
        room: { equals: roomTrimmed, mode: 'insensitive' },
        dayOfWeek,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
        ...timeCondition,
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    for (const c of roomClashes) {
      conflicts.push({
        type: 'ROOM',
        message: `Ruang "${roomTrimmed}" sudah dipakai oleh ${c.class.name} (${c.subject.name}) (${c.startTime} - ${c.endTime})`,
      });
    }
  }

  return NextResponse.json({
    hasConflict: conflicts.length > 0,
    conflicts,
  });
}
