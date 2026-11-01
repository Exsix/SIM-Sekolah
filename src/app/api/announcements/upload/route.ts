import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File lampiran tidak ditemukan' }, { status: 400 });
    }

    // Max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file lampiran maksimal 5MB' }, { status: 400 });
    }

    const validMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!validMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus PDF, Word, atau Gambar (JPG/PNG/WEBP)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `lampiran-${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'announcements');

    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/announcements/${filename}`;

    return NextResponse.json({ url, filename: file.name, size: file.size });
  } catch (err: unknown) {
    console.error('File upload error', err);
    return NextResponse.json({ error: 'Gagal mengunggah lampiran' }, { status: 500 });
  }
}
