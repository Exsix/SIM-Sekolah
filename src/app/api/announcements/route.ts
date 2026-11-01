import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Judul pengumuman minimal 3 karakter').max(200),
  content: z.string().min(10, 'Konten pengumuman minimal 10 karakter'),
  targetRole: z.enum(['ALL', 'SISWA', 'GURU', 'ORANG_TUA']).default('ALL'),
  targetClassId: z.string().optional().nullable(),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  authorName: z.string().max(100).optional().nullable(),
  attachmentUrl: z.string().max(255).optional().nullable(),
  isPublished: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const targetRole = searchParams.get('targetRole');
  const isPublished = searchParams.get('isPublished');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Role-based visibility
  const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN';

  if (!isAdmin) {
    // Non-admin can only see published announcements
    where.isPublished = true;

    // Filter by target audience
    if (session.role === 'SISWA') {
      where.targetRole = { in: ['ALL', 'SISWA'] };
    } else if (session.role === 'GURU' || session.role === 'WALI_KELAS') {
      where.targetRole = { in: ['ALL', 'GURU'] };
    } else if (session.role === 'ORANG_TUA') {
      where.targetRole = { in: ['ALL', 'ORANG_TUA'] };
    }
  } else {
    // Admin can filter by targetRole or isPublished if provided
    if (targetRole) where.targetRole = targetRole;
    if (isPublished !== null && isPublished !== '') where.isPublished = isPublished === 'true';
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { authorName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.announcement.count({ where }),
  ]);

  return NextResponse.json({
    data: announcements,
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
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const defaultAuthor = session.username || 'Staf Sekolah';
  const author = data.authorName?.trim() || defaultAuthor;

  const publishDate = data.publishDate ? new Date(data.publishDate) : new Date();
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
      targetRole: data.targetRole,
      targetClassId: data.targetClassId || null,
      publishDate,
      expiryDate,
      authorName: author,
      attachmentUrl: data.attachmentUrl || null,
      isPublished: data.isPublished,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENGUMUMAN',
      action: 'CREATE',
      recordId: announcement.id,
      description: `Menerbitkan pengumuman baru: ${announcement.title} (Target: ${announcement.targetRole})`,
      newData: announcement as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: announcement }, { status: 201 });
}
