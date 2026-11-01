import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(2, 'Nama kelas minimal 2 karakter').max(50),
  gradeLevel: z.number().int().min(1).max(12),
  major: z.string().max(50).optional().nullable(),
  room: z.string().max(30).optional().nullable(),
  capacity: z.number().int().min(1).max(60).default(36),
  academicYearId: z.string().optional().nullable(),
  homeroomTeacherId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const gradeLevel = searchParams.get('gradeLevel');
  const major = searchParams.get('major') || '';
  const academicYearId = searchParams.get('academicYearId') || '';
  const isActive = searchParams.get('isActive');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { major: { contains: search, mode: 'insensitive' } },
      { room: { contains: search, mode: 'insensitive' } },
      { homeroomTeacher: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (gradeLevel) where.gradeLevel = parseInt(gradeLevel);
  if (major) where.major = major;
  if (academicYearId) where.academicYearId = academicYearId;
  if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      include: {
        homeroomTeacher: {
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
            isActive: true,
          },
        },
        _count: {
          select: {
            students: true,
            schedules: true,
          },
        },
      },
    }),
    prisma.class.count({ where }),
  ]);

  return NextResponse.json({
    data: classes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat menambah kelas' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Resolve academic year if not provided: find active one
  let academicYearId = data.academicYearId;
  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) {
      return NextResponse.json({ error: 'Tidak ada tahun ajaran aktif. Silakan pilih tahun ajaran.' }, { status: 400 });
    }
    academicYearId = activeYear.id;
  }

  // Cek nama kelas unik dalam tahun ajaran yang sama
  const existing = await prisma.class.findFirst({
    where: {
      name: data.name,
      academicYearId,
    },
  });
  if (existing) {
    return NextResponse.json({ error: `Kelas ${data.name} sudah ada untuk tahun ajaran ini` }, { status: 409 });
  }

  // Cek apakah wali kelas sudah menjadi wali kelas lain di tahun ajaran ini
  if (data.homeroomTeacherId) {
    const teacherAssigned = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: data.homeroomTeacherId,
        academicYearId,
        isActive: true,
      },
    });
    if (teacherAssigned) {
      return NextResponse.json(
        { error: `Guru ini sudah menjadi wali kelas untuk ${teacherAssigned.name}` },
        { status: 409 }
      );
    }
  }

  const newClass = await prisma.class.create({
    data: {
      name: data.name,
      gradeLevel: data.gradeLevel,
      major: data.major || null,
      room: data.room || null,
      capacity: data.capacity,
      academicYearId,
      homeroomTeacherId: data.homeroomTeacherId || null,
      isActive: data.isActive ?? true,
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

  // Log aktivitas
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'KELAS',
      action: 'CREATE',
      recordId: newClass.id,
      description: `Membuat kelas baru: ${newClass.name} (Tingkat: ${newClass.gradeLevel})`,
      newData: newClass as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: newClass }, { status: 201 });
}
