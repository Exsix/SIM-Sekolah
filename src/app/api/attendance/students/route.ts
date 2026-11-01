import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { z } from 'zod';

const attendanceStatusEnum = z.enum(['HADIR', 'SAKIT', 'IZIN', 'ALPA', 'DISPENSASI']);

const batchAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class ID wajib diisi'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  scheduleId: z.string().optional().nullable(),
  attendances: z.array(
    z.object({
      studentId: z.string().min(1),
      status: attendanceStatusEnum,
      notes: z.string().optional().nullable(),
    })
  ).min(1, 'Minimal satu data absensi siswa'),
});

// GET /api/attendance/students?classId=...&date=YYYY-MM-DD&scheduleId=...
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const scheduleId = searchParams.get('scheduleId') || null;

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

  // Parse date
  const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);

  // Fetch active students in class
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

  // Fetch existing attendance records on that date
  const existingAttendances = await prisma.studentAttendance.findMany({
    where: {
      classId,
      date: parsedDate,
      scheduleId: scheduleId || null,
    },
  });

  const attendanceMap = new Map(existingAttendances.map((a) => [a.studentId, a]));

  let countHadir = 0;
  let countSakit = 0;
  let countIzin = 0;
  let countAlpa = 0;
  let countDispensasi = 0;
  let isRecorded = existingAttendances.length > 0;

  const studentAttendances = students.map((s) => {
    const record = attendanceMap.get(s.id);
    const status = record ? record.status : 'HADIR';
    const notes = record ? record.notes : '';

    if (status === 'HADIR') countHadir++;
    else if (status === 'SAKIT') countSakit++;
    else if (status === 'IZIN') countIzin++;
    else if (status === 'ALPA') countAlpa++;
    else if (status === 'DISPENSASI') countDispensasi++;

    return {
      studentId: s.id,
      nis: s.nis,
      nisn: s.nisn,
      name: s.name,
      gender: s.gender,
      photoUrl: s.photoUrl,
      status,
      notes: notes || '',
      attendanceId: record ? record.id : null,
    };
  });

  const totalStudents = students.length;
  const attendanceRate = totalStudents > 0 
    ? Math.round(((countHadir + countDispensasi) / totalStudents) * 100) 
    : 0;

  return NextResponse.json({
    data: {
      class: {
        id: targetClass.id,
        name: targetClass.name,
        gradeLevel: targetClass.gradeLevel,
        homeroomTeacher: targetClass.homeroomTeacher?.name || '-',
      },
      date: dateStr,
      scheduleId,
      isRecorded,
      stats: {
        total: totalStudents,
        hadir: countHadir,
        sakit: countSakit,
        izin: countIzin,
        alpa: countAlpa,
        dispensasi: countDispensasi,
        attendanceRate,
      },
      students: studentAttendances,
    },
  });
}

// POST /api/attendance/students (Batch record/update attendance)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = batchAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const { classId, date: dateStr, scheduleId, attendances } = parsed.data;

  const targetClass = await prisma.class.findUnique({ where: { id: classId } });
  if (!targetClass) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);

  // Find user's teacher record if available
  const teacherUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { teacher: { select: { id: true } } },
  });
  const teacherId = teacherUser?.teacher?.id || null;

  // Execute batch upsert in transaction
  await prisma.$transaction(async (tx) => {
    for (const item of attendances) {
      const existing = await tx.studentAttendance.findFirst({
        where: {
          studentId: item.studentId,
          classId,
          date: parsedDate,
          scheduleId: scheduleId || null,
        },
      });

      if (existing) {
        await tx.studentAttendance.update({
          where: { id: existing.id },
          data: {
            status: item.status,
            notes: item.notes || null,
            teacherId,
          },
        });
      } else {
        await tx.studentAttendance.create({
          data: {
            studentId: item.studentId,
            classId,
            date: parsedDate,
            scheduleId: scheduleId || null,
            status: item.status,
            notes: item.notes || null,
            teacherId,
          },
        });
      }
    }
  });

  // Calculate summary for log
  const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALPA: 0, DISPENSASI: 0 };
  for (const item of attendances) {
    counts[item.status]++;
  }

  // Audit activity log
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'ABSENSI',
      action: 'RECORD_STUDENT_ATTENDANCE',
      recordId: classId,
      description: `Mencatat kehadiran kelas ${targetClass.name} tgl ${dateStr} (H:${counts.HADIR}, S:${counts.SAKIT}, I:${counts.IZIN}, A:${counts.ALPA}, D:${counts.DISPENSASI})`,
      newData: {
        classId,
        date: dateStr,
        summary: counts,
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    success: true,
    message: `Data kehadiran kelas ${targetClass.name} untuk tanggal ${dateStr} berhasil disimpan`,
    summary: counts,
  });
}
