import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateAnnouncementSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  targetRole: z.enum(['ALL', 'SISWA', 'GURU', 'ORANG_TUA']).optional(),
  targetClassId: z.string().optional().nullable(),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  authorName: z.string().max(100).optional().nullable(),
  attachmentUrl: z.string().max(255).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
  }

  // Check visibility for non-admins
  const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN';
  if (!isAdmin) {
    if (!announcement.isPublished) {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }
    if (session.role === 'SISWA' && announcement.targetRole !== 'ALL' && announcement.targetRole !== 'SISWA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if ((session.role === 'GURU' || session.role === 'WALI_KELAS') && announcement.targetRole !== 'ALL' && announcement.targetRole !== 'GURU') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ data: announcement });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title.trim() }),
      ...(data.content && { content: data.content.trim() }),
      ...(data.targetRole && { targetRole: data.targetRole }),
      ...(data.targetClassId !== undefined && { targetClassId: data.targetClassId }),
      ...(data.publishDate && { publishDate: new Date(data.publishDate) }),
      ...(data.expiryDate !== undefined && {
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      }),
      ...(data.authorName !== undefined && { authorName: data.authorName?.trim() || null }),
      ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENGUMUMAN',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui pengumuman: ${updated.title}`,
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
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENGUMUMAN',
      action: 'DELETE',
      recordId: id,
      description: `Menghapus pengumuman: ${existing.title}`,
      oldData: existing as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Pengumuman berhasil dihapus' });
}
