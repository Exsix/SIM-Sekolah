import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const createStudentSchema = z.object({
  nis: z.string().min(1, 'NIS wajib diisi').max(20),
  nisn: z.string().max(20).optional().nullable(),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  birthPlace: z.string().max(100).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  religion: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email tidak valid').optional().nullable().or(z.literal('')),
  entryYear: z.number().int().min(2000).max(2100),
  status: z.enum(['AKTIF', 'LULUS', 'PINDAH', 'KELUAR', 'DROPOUT']).default('AKTIF'),
  classId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const classId = searchParams.get('classId') || '';
  const status = searchParams.get('status') || '';
  const entryYear = searchParams.get('entryYear') || '';
  const sortBy = searchParams.get('sortBy') || 'name';
  const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nis: { contains: search, mode: 'insensitive' } },
      { nisn: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (classId) where.classId = classId;
  if (status) where.status = status;
  if (entryYear) where.entryYear = parseInt(entryYear);

  const validSortFields: Record<string, unknown> = {
    name: { name: order },
    nis: { nis: order },
    entryYear: { entryYear: order },
    status: { status: order },
    createdAt: { createdAt: order },
  };
  const orderBy = validSortFields[sortBy] || { name: 'asc' };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        class: { select: { id: true, name: true, gradeLevel: true } },
        _count: { select: { parents: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    data: students,
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
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat menambah siswa' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Cek NIS unik
  const existing = await prisma.student.findUnique({ where: { nis: data.nis } });
  if (existing) {
    return NextResponse.json({ error: `NIS ${data.nis} sudah digunakan` }, { status: 409 });
  }

  // Cek NISN unik jika ada
  if (data.nisn) {
    const existingNisn = await prisma.student.findUnique({ where: { nisn: data.nisn } });
    if (existingNisn) {
      return NextResponse.json({ error: `NISN ${data.nisn} sudah digunakan` }, { status: 409 });
    }
  }

  const student = await prisma.student.create({
    data: {
      nis: data.nis,
      nisn: data.nisn || null,
      name: data.name,
      gender: data.gender,
      birthPlace: data.birthPlace || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      religion: data.religion || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      entryYear: data.entryYear,
      status: data.status,
      classId: data.classId || null,
      notes: data.notes || null,
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
      action: 'CREATE',
      recordId: student.id,
      description: `Menambahkan siswa baru: ${student.name} (NIS: ${student.nis})`,
      newData: student as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: student }, { status: 201 });
}
