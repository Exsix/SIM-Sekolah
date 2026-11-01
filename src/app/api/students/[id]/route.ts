import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateStudentSchema = z.object({
  nis: z.string().min(1).max(20).optional(),
  nisn: z.string().max(20).optional().nullable(),
  name: z.string().min(2).max(100).optional(),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional(),
  birthPlace: z.string().max(100).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  religion: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  entryYear: z.number().int().min(2000).max(2100).optional(),
  status: z.enum(['AKTIF', 'LULUS', 'PINDAH', 'KELUAR', 'DROPOUT']).optional(),
  classId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, gradeLevel: true } },
      parents: {
        include: {
          parent: true,
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          schedule: {
            include: { subject: { select: { name: true } } },
          },
        },
      },
      grades: {
        orderBy: { createdAt: 'desc' },
        include: {
          gradeItem: {
            include: {
              subject: { select: { name: true, code: true } },
            },
          },
        },
      },
      achievements: {
        orderBy: { date: 'desc' },
      },
      libraryMember: {
        include: {
          borrowings: {
            orderBy: { borrowDate: 'desc' },
            include: {
              items: {
                include: {
                  bookCopy: {
                    include: {
                      book: { select: { title: true, author: true, isbn: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: student });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Cek NIS unik jika diubah
  if (data.nis && data.nis !== existing.nis) {
    const nisTaken = await prisma.student.findFirst({ where: { nis: data.nis, id: { not: id } } });
    if (nisTaken) {
      return NextResponse.json({ error: `NIS ${data.nis} sudah digunakan` }, { status: 409 });
    }
  }

  // Cek NISN unik jika diubah
  if (data.nisn && data.nisn !== existing.nisn) {
    const nisnTaken = await prisma.student.findFirst({ where: { nisn: data.nisn, id: { not: id } } });
    if (nisnTaken) {
      return NextResponse.json({ error: `NISN ${data.nisn} sudah digunakan` }, { status: 409 });
    }
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(data.nis && { nis: data.nis }),
      nisn: data.nisn !== undefined ? data.nisn : undefined,
      ...(data.name && { name: data.name }),
      ...(data.gender && { gender: data.gender }),
      birthPlace: data.birthPlace !== undefined ? data.birthPlace : undefined,
      birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : undefined,
      religion: data.religion !== undefined ? data.religion : undefined,
      address: data.address !== undefined ? data.address : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      email: data.email !== undefined ? (data.email || null) : undefined,
      ...(data.entryYear && { entryYear: data.entryYear }),
      ...(data.status && { status: data.status }),
      classId: data.classId !== undefined ? data.classId : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
    },
    include: {
      class: { select: { id: true, name: true, gradeLevel: true } },
    },
  });

  // Log aktivitas
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'SISWA',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui data siswa: ${updated.name} (NIS: ${updated.nis})`,
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

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  // Soft delete — ubah status ke KELUAR
  const updated = await prisma.student.update({
    where: { id },
    data: { status: 'KELUAR' },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'SISWA',
      action: 'DELETE',
      recordId: id,
      description: `Menonaktifkan data siswa: ${existing.name} (Status: KELUAR)`,
      oldData: existing as object,
      newData: { status: 'KELUAR' },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Siswa berhasil dinonaktifkan', data: updated });
}
