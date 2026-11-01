import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null || formData.get('photo') as File | null;

    if (!file) return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file foto maksimal 2MB' }, { status: 400 });
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WEBP' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'teachers');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const photoUrl = `/uploads/teachers/${filename}`;
    const updated = await prisma.teacher.update({ where: { id }, data: { photoUrl } });

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'GURU',
        action: 'UPDATE_PHOTO',
        recordId: id,
        description: `Mengunggah foto baru untuk guru: ${teacher.name}`,
        newData: { photoUrl },
        ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
        userAgent: req.headers.get('user-agent') || 'internal',
      },
    });

    return NextResponse.json({ success: true, photoUrl, teacher: updated });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah foto' }, { status: 500 });
  }
}
