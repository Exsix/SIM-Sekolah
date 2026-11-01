import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateClassSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  major: z.string().max(50).optional().nullable(),
  room: z.string().max(30).optional().nullable(),
  capacity: z.number().int().min(1).max(60).optional(),
  homeroomTeacherId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      homeroomTeacher: {
        select: {
          id: true,
          name: true,
          nip: true,
          phone: true,
          email: true,
          photoUrl: true,
          position: true,
        },
      },
      academicYear: {
        select: {
          id: true,
          name: true,
          semester: true,
          isActive: true,
        },
      },
      students: {
        where: { status: 'AKTIF' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          nis: true,
          nisn: true,
          name: true,
          gender: true,
          status: true,
          photoUrl: true,
          phone: true,
          email: true,
        },
      },
      schedules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        include: {
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          students: true,
          schedules: true,
        },
      },
    },
  });

  if (!classData) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: classData });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Check unique name in same academic year if changed
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.class.findFirst({
      where: {
        name: data.name,
        academicYearId: existing.academicYearId,
        id: { not: id },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: `Kelas ${data.name} sudah ada untuk tahun ajaran ini` }, { status: 409 });
    }
  }

  // Check homeroom teacher uniqueness if changed
  if (data.homeroomTeacherId && data.homeroomTeacherId !== existing.homeroomTeacherId) {
    const teacherAssigned = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: data.homeroomTeacherId,
        academicYearId: existing.academicYearId,
        isActive: true,
        id: { not: id },
      },
    });
    if (teacherAssigned) {
      return NextResponse.json(
        { error: `Guru ini sudah menjadi wali kelas untuk ${teacherAssigned.name}` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.class.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.gradeLevel && { gradeLevel: data.gradeLevel }),
      major: data.major !== undefined ? data.major : undefined,
      room: data.room !== undefined ? data.room : undefined,
      ...(data.capacity && { capacity: data.capacity }),
      homeroomTeacherId: data.homeroomTeacherId !== undefined ? data.homeroomTeacherId : undefined,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      homeroomTeacher: {
        select: { id: true, name: true, nip: true, photoUrl: true },
      },
      academicYear: {
        select: { id: true, name: true, semester: true },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'KELAS',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui kelas: ${updated.name}`,
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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  // Soft delete — set isActive to false
  const updated = await prisma.class.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'KELAS',
      action: 'DELETE',
      recordId: id,
      description: `Menonaktifkan kelas: ${existing.name}`,
      oldData: existing as object,
      newData: { isActive: false },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Kelas berhasil dinonaktifkan', data: updated });
}
