import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateSubjectSchema = z.object({
  code: z.string().min(2).max(20).optional(),
  name: z.string().min(2).max(100).optional(),
  category: z.string().max(50).optional().nullable(),
  gradeLevel: z.number().int().min(10).max(12).optional().nullable(),
  isActive: z.boolean().optional(),
  teacherIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      teacherSubject: {
        include: {
          teacher: {
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
            },
          },
        },
      },
      schedules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        include: {
          class: { select: { id: true, name: true, gradeLevel: true } },
          teacher: { select: { id: true, name: true } },
        },
      },
      gradeItems: {
        orderBy: { createdAt: 'desc' },
        include: {
          class: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
          _count: { select: { grades: true } },
        },
      },
      _count: {
        select: {
          schedules: true,
          gradeItems: true,
          teacherSubject: true,
        },
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: subject });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Check unique code if changed
  if (data.code && data.code.trim().toUpperCase() !== existing.code) {
    const upperCode = data.code.trim().toUpperCase();
    const duplicate = await prisma.subject.findFirst({
      where: { code: upperCode, id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: `Kode mapel ${upperCode} sudah digunakan` }, { status: 409 });
    }
  }

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });

  const updated = await prisma.$transaction(async (tx) => {
    const sub = await tx.subject.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.trim().toUpperCase() }),
        ...(data.name && { name: data.name.trim() }),
        category: data.category !== undefined ? data.category : undefined,
        gradeLevel: data.gradeLevel !== undefined ? data.gradeLevel : undefined,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // If teacherIds provided, sync teachers for active academic year
    if (data.teacherIds !== undefined && activeYear) {
      // Delete existing assignments for active academic year
      await tx.teacherSubject.deleteMany({
        where: { subjectId: id, academicYearId: activeYear.id },
      });

      // Insert new ones
      for (const tId of data.teacherIds) {
        await tx.teacherSubject.create({
          data: {
            subjectId: id,
            teacherId: tId,
            academicYearId: activeYear.id,
          },
        });
      }
    }

    return sub;
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'MAPEL',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui mata pelajaran: ${updated.name} (${updated.code})`,
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
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
  }

  const updated = await prisma.subject.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'MAPEL',
      action: 'DELETE',
      recordId: id,
      description: `Menonaktifkan mata pelajaran: ${existing.name} (${existing.code})`,
      oldData: existing as object,
      newData: { isActive: false },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Mata pelajaran berhasil dinonaktifkan', data: updated });
}
