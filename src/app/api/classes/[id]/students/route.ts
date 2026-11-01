import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES, STAFF_ROLES } from '@/lib/session';

// GET eligible unassigned students or all active students for placement modal
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const currentClass = await prisma.class.findUnique({ where: { id } });
  if (!currentClass) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const onlyUnassigned = searchParams.get('onlyUnassigned') !== 'false';

  const where: Record<string, unknown> = {
    status: 'AKTIF',
  };

  if (onlyUnassigned) {
    where.OR = [
      { classId: null },
      { classId: { not: id } },
    ];
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nis: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 50,
    select: {
      id: true,
      nis: true,
      nisn: true,
      name: true,
      gender: true,
      classId: true,
      photoUrl: true,
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ data: students });
}

// POST: Assign students to class
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const targetClass = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!targetClass) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });

  let body: { studentIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const studentIds = body.studentIds;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ error: 'Pilih setidaknya satu siswa' }, { status: 400 });
  }

  // Check capacity
  const currentCount = targetClass._count.students;
  if (currentCount + studentIds.length > targetClass.capacity) {
    return NextResponse.json(
      {
        error: `Kapasitas kelas tidak mencukupi. Tersisa ${targetClass.capacity - currentCount} kursi, namun Anda memilih ${studentIds.length} siswa.`,
      },
      { status: 400 }
    );
  }

  // Update students & create ClassStudent records
  await prisma.$transaction(async (tx) => {
    // 1. Update student classId
    await tx.student.updateMany({
      where: { id: { in: studentIds } },
      data: { classId: id },
    });

    // 2. Upsert into ClassStudent for historical tracking
    for (const studentId of studentIds) {
      await tx.classStudent.upsert({
        where: {
          classId_studentId_academicYearId: {
            classId: id,
            studentId,
            academicYearId: targetClass.academicYearId,
          },
        },
        update: { status: 'AKTIF' },
        create: {
          classId: id,
          studentId,
          academicYearId: targetClass.academicYearId,
          status: 'AKTIF',
        },
      });
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'KELAS',
      action: 'ASSIGN_STUDENTS',
      recordId: id,
      description: `Menempatkan ${studentIds.length} siswa ke kelas ${targetClass.name}`,
      newData: { studentIds, classId: id },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    success: true,
    message: `${studentIds.length} siswa berhasil ditempatkan ke kelas ${targetClass.name}`,
  });
}

// DELETE: Remove a student from class
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const targetClass = await prisma.class.findUnique({ where: { id } });
  if (!targetClass) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ error: 'studentId wajib disertakan' }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });

  // Remove from class
  await prisma.student.update({
    where: { id: studentId },
    data: { classId: null },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'KELAS',
      action: 'REMOVE_STUDENT',
      recordId: id,
      description: `Mengeluarkan siswa ${student.name} dari kelas ${targetClass.name}`,
      newData: { studentId, classId: null },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    success: true,
    message: `Siswa ${student.name} berhasil dikeluarkan dari kelas`,
  });
}
