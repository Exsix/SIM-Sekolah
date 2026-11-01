import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const createTeacherSchema = z.object({
  nip: z.string().max(30).optional().nullable(),
  nuptk: z.string().max(20).optional().nullable(),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(150),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  birthPlace: z.string().max(100).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email tidak valid').optional().nullable().or(z.literal('')),
  education: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  employmentStatus: z.enum(['PNS', 'PPPK', 'GURU_TETAP_YAYASAN', 'GURU_HONORER']).default('GURU_HONORER'),
  joinDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
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
  const status = searchParams.get('status') || ''; // employmentStatus
  const isActive = searchParams.get('isActive') || '';
  const sortBy = searchParams.get('sortBy') || 'name';
  const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nip: { contains: search, mode: 'insensitive' } },
      { nuptk: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.employmentStatus = status;
  if (isActive !== '') where.isActive = isActive === 'true';

  const validSort: Record<string, unknown> = {
    name: { name: order },
    nip: { nip: order },
    employmentStatus: { employmentStatus: order },
    joinDate: { joinDate: order },
    createdAt: { createdAt: order },
  };
  const orderBy = validSort[sortBy] || { name: 'asc' };

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        classesAdvised: { select: { id: true, name: true } },
        teacherSubjects: {
          include: { subject: { select: { name: true, code: true } } },
          take: 3,
        },
        _count: { select: { schedules: true, teacherSubjects: true } },
      },
    }),
    prisma.teacher.count({ where }),
  ]);

  return NextResponse.json({
    data: teachers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat menambah guru' }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createTeacherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Cek NIP unik
  if (data.nip) {
    const existingNip = await prisma.teacher.findUnique({ where: { nip: data.nip } });
    if (existingNip) return NextResponse.json({ error: `NIP ${data.nip} sudah digunakan` }, { status: 409 });
  }
  // Cek NUPTK unik
  if (data.nuptk) {
    const existingNuptk = await prisma.teacher.findUnique({ where: { nuptk: data.nuptk } });
    if (existingNuptk) return NextResponse.json({ error: `NUPTK ${data.nuptk} sudah digunakan` }, { status: 409 });
  }

  const teacher = await prisma.teacher.create({
    data: {
      nip: data.nip || null,
      nuptk: data.nuptk || null,
      name: data.name,
      gender: data.gender,
      birthPlace: data.birthPlace || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      education: data.education || null,
      position: data.position || null,
      employmentStatus: data.employmentStatus,
      joinDate: data.joinDate ? new Date(data.joinDate) : null,
      isActive: data.isActive ?? true,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'GURU',
      action: 'CREATE',
      recordId: teacher.id,
      description: `Menambahkan guru/staf baru: ${teacher.name} (NIP: ${teacher.nip || '-'})`,
      newData: teacher as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: teacher }, { status: 201 });
}
