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

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null || formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
    }

    // Validate size (max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file foto maksimal 2MB' }, { status: 400 });
    }

    // Validate mimetype
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WEBP' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'students');
    
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const photoUrl = `/uploads/students/${filename}`;

    const updated = await prisma.student.update({
      where: { id },
      data: { photoUrl },
    });

    // Log aktivitas
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'SISWA',
        action: 'UPDATE_PHOTO',
        recordId: id,
        description: `Mengunggah foto baru untuk siswa: ${student.name} (${student.nis})`,
        newData: { photoUrl },
        ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
        userAgent: req.headers.get('user-agent') || 'internal',
      },
    });

    return NextResponse.json({ success: true, photoUrl, student: updated });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah foto' }, { status: 500 });
  }
}
