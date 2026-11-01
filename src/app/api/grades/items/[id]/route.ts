import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { AssessmentType } from '@prisma/client';
import { z } from 'zod';

const updateGradeItemSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.nativeEnum(AssessmentType).optional(),
  weight: z.number().min(0.1).optional(),
  maxScore: z.number().min(10).max(1000).optional(),
  teacherId: z.string().min(1).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const item = await prisma.gradeItem.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          students: {
            where: { status: 'AKTIF' },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              nis: true,
              nisn: true,
              name: true,
              gender: true,
              photoUrl: true,
            },
          },
        },
      },
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
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
      grades: {
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Komponen penilaian tidak ditemukan' }, { status: 404 });
  }

  // Map grades to each student in class
  const gradesByStudentId = new Map(item.grades.map((g) => [g.studentId, g]));

  const rosterWithGrades = item.class.students.map((student) => {
    const existingGrade = gradesByStudentId.get(student.id);
    return {
      student,
      grade: existingGrade
        ? {
            id: existingGrade.id,
            score: existingGrade.score,
            notes: existingGrade.notes,
            isPublished: existingGrade.isPublished,
            updatedAt: existingGrade.updatedAt,
          }
        : null,
    };
  });

  return NextResponse.json({
    data: {
      ...item,
      roster: rosterWithGrades,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.gradeItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Komponen penilaian tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateGradeItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const updated = await prisma.gradeItem.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.type && { type: data.type }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
      ...(data.teacherId && { teacherId: data.teacherId }),
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENILAIAN',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui komponen penilaian: ${updated.name} (${updated.subject.name} - ${updated.class.name})`,
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
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.gradeItem.findUnique({
    where: { id },
    include: { class: true, subject: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Komponen penilaian tidak ditemukan' }, { status: 404 });
  }

  await prisma.gradeItem.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENILAIAN',
      action: 'DELETE',
      recordId: id,
      description: `Menghapus komponen penilaian: ${existing.name} (${existing.subject.name} - ${existing.class.name})`,
      oldData: existing as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Komponen penilaian berhasil dihapus' });
}
