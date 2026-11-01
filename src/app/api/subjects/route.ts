import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const createSubjectSchema = z.object({
  code: z.string().min(2, 'Kode mapel minimal 2 karakter').max(20),
  name: z.string().min(2, 'Nama mapel minimal 2 karakter').max(100),
  category: z.string().max(50).optional().nullable(),
  gradeLevel: z.number().int().min(10).max(12).optional().nullable(),
  isActive: z.boolean().default(true),
  teacherIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const gradeLevel = searchParams.get('gradeLevel');
  const isActive = searchParams.get('isActive');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;
  if (gradeLevel) where.gradeLevel = parseInt(gradeLevel);
  if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        teacherSubject: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                nip: true,
                photoUrl: true,
              },
            },
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
    }),
    prisma.subject.count({ where }),
  ]);

  return NextResponse.json({
    data: subjects,
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
    return NextResponse.json({ error: 'Forbidden - Hanya Admin yang dapat menambah mata pelajaran' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;
  const upperCode = data.code.trim().toUpperCase();

  // Check code uniqueness
  const existing = await prisma.subject.findUnique({ where: { code: upperCode } });
  if (existing) {
    return NextResponse.json({ error: `Kode mapel ${upperCode} sudah digunakan` }, { status: 409 });
  }

  // Get active academic year for assigning teachers
  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });

  const newSubject = await prisma.$transaction(async (tx) => {
    const subject = await tx.subject.create({
      data: {
        code: upperCode,
        name: data.name.trim(),
        category: data.category || null,
        gradeLevel: data.gradeLevel || null,
        isActive: data.isActive,
      },
    });

    if (data.teacherIds && data.teacherIds.length > 0 && activeYear) {
      for (const tId of data.teacherIds) {
        await tx.teacherSubject.create({
          data: {
            subjectId: subject.id,
            teacherId: tId,
            academicYearId: activeYear.id,
          },
        });
      }
    }

    return subject;
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'MAPEL',
      action: 'CREATE',
      recordId: newSubject.id,
      description: `Membuat mata pelajaran baru: ${newSubject.name} (${newSubject.code})`,
      newData: newSubject as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: newSubject }, { status: 201 });
}
