import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateTeacherSchema = z.object({
  nip: z.string().max(30).optional().nullable(),
  nuptk: z.string().max(20).optional().nullable(),
  name: z.string().min(2).max(150).optional(),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional(),
  birthPlace: z.string().max(100).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  education: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  employmentStatus: z.enum(['PNS', 'PPPK', 'GURU_TETAP_YAYASAN', 'GURU_HONORER']).optional(),
  joinDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      classesAdvised: {
        select: { id: true, name: true, gradeLevel: true, major: true, room: true },
      },
      teacherSubjects: {
        include: {
          subject: { select: { id: true, name: true, code: true, category: true } },
          academicYear: { select: { name: true, semester: true } },
        },
        orderBy: { academicYear: { name: 'desc' } },
      },
      schedules: {
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
        orderBy: { dayOfWeek: 'asc' },
        take: 20,
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      gradeItems: {
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!teacher) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ data: teacher });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateTeacherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  if (data.nip && data.nip !== existing.nip) {
    const taken = await prisma.teacher.findFirst({ where: { nip: data.nip, id: { not: id } } });
    if (taken) return NextResponse.json({ error: `NIP ${data.nip} sudah digunakan` }, { status: 409 });
  }
  if (data.nuptk && data.nuptk !== existing.nuptk) {
    const taken = await prisma.teacher.findFirst({ where: { nuptk: data.nuptk, id: { not: id } } });
    if (taken) return NextResponse.json({ error: `NUPTK ${data.nuptk} sudah digunakan` }, { status: 409 });
  }

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      nip: data.nip !== undefined ? data.nip : undefined,
      nuptk: data.nuptk !== undefined ? data.nuptk : undefined,
      ...(data.name && { name: data.name }),
      ...(data.gender && { gender: data.gender }),
      birthPlace: data.birthPlace !== undefined ? data.birthPlace : undefined,
      birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : undefined,
      address: data.address !== undefined ? data.address : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      email: data.email !== undefined ? (data.email || null) : undefined,
      education: data.education !== undefined ? data.education : undefined,
      position: data.position !== undefined ? data.position : undefined,
      ...(data.employmentStatus && { employmentStatus: data.employmentStatus }),
      joinDate: data.joinDate !== undefined ? (data.joinDate ? new Date(data.joinDate) : null) : undefined,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'GURU',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui data guru: ${updated.name} (NIP: ${updated.nip || '-'})`,
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
  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });

  // Soft delete — set isActive = false
  const updated = await prisma.teacher.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'GURU',
      action: 'DELETE',
      recordId: id,
      description: `Menonaktifkan guru/staf: ${existing.name}`,
      oldData: existing as object,
      newData: { isActive: false },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Guru berhasil dinonaktifkan', data: updated });
}
