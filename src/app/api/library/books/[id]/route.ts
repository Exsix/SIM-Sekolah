import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateBookSchema = z.object({
  isbn: z.string().max(30).optional().nullable(),
  title: z.string().min(2).max(200).optional(),
  author: z.string().min(2).max(150).optional(),
  publisher: z.string().max(100).optional().nullable(),
  publishYear: z.number().int().min(1900).optional().nullable(),
  categoryId: z.string().min(1).optional(),
  rackLocation: z.string().max(50).optional().nullable(),
  condition: z.string().optional(),
  description: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      category: true,
      copies: {
        include: {
          borrowingItems: {
            where: { status: 'DIPINJAM' },
            include: {
              borrowing: {
                include: {
                  member: {
                    include: {
                      student: { select: { id: true, name: true, nis: true } },
                      teacher: { select: { id: true, name: true, nip: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: book });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Check unique ISBN if updated
  if (data.isbn && data.isbn.trim() !== existing.isbn) {
    const duplicate = await prisma.book.findFirst({
      where: { isbn: data.isbn.trim(), id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: `ISBN ${data.isbn} sudah digunakan pada buku lain` }, { status: 409 });
    }
  }

  const updated = await prisma.book.update({
    where: { id },
    data: {
      ...(data.isbn !== undefined && { isbn: data.isbn?.trim() || null }),
      ...(data.title && { title: data.title.trim() }),
      ...(data.author && { author: data.author.trim() }),
      ...(data.publisher !== undefined && { publisher: data.publisher?.trim() || null }),
      ...(data.publishYear !== undefined && { publishYear: data.publishYear }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.rackLocation !== undefined && { rackLocation: data.rackLocation?.trim() || null }),
      ...(data.condition && { condition: data.condition }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
    },
    include: { category: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PERPUSTAKAAN',
      action: 'UPDATE',
      recordId: id,
      description: `Memperbarui data buku: ${updated.title}`,
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
  const existing = await prisma.book.findUnique({
    where: { id },
    include: {
      copies: {
        where: { status: 'DIPINJAM' },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });
  }

  if (existing.copies.length > 0) {
    return NextResponse.json(
      { error: `Buku tidak dapat dihapus karena masih ada ${existing.copies.length} eksemplar yang sedang dipinjam` },
      { status: 400 }
    );
  }

  await prisma.book.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PERPUSTAKAAN',
      action: 'DELETE',
      recordId: id,
      description: `Menghapus buku: ${existing.title}`,
      oldData: existing as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ message: 'Buku berhasil dihapus dari perpustakaan' });
}
