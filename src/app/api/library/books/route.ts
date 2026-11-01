import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { BookCopyStatus } from '@prisma/client';
import { z } from 'zod';

const createBookSchema = z.object({
  isbn: z.string().max(30).optional().nullable(),
  title: z.string().min(2, 'Judul buku minimal 2 karakter').max(200),
  author: z.string().min(2, 'Nama penulis minimal 2 karakter').max(150),
  publisher: z.string().max(100).optional().nullable(),
  publishYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  categoryId: z.string().min(1, 'Kategori buku wajib dipilih'),
  rackLocation: z.string().max(50).optional().nullable(),
  totalCopies: z.number().int().min(1, 'Jumlah eksemplar minimal 1').default(1),
  condition: z.string().default('Baik'),
  description: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId');
  const availableOnly = searchParams.get('availableOnly') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } },
      { publisher: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (availableOnly) where.availableCopies = { gt: 0 };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ title: 'asc' }],
      include: {
        category: { select: { id: true, code: true, name: true } },
        copies: {
          select: {
            id: true,
            copyCode: true,
            status: true,
            condition: true,
          },
        },
        _count: {
          select: { copies: true },
        },
      },
    }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({
    data: books,
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

  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Check unique ISBN if provided
  if (data.isbn?.trim()) {
    const existing = await prisma.book.findUnique({ where: { isbn: data.isbn.trim() } });
    if (existing) {
      return NextResponse.json({ error: `ISBN ${data.isbn} sudah terdaftar di sistem` }, { status: 409 });
    }
  }

  const category = await prisma.bookCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    return NextResponse.json({ error: 'Kategori buku tidak ditemukan' }, { status: 404 });
  }

  // Create Book & physical copies in transaction
  const newBook = await prisma.$transaction(async (tx) => {
    const book = await tx.book.create({
      data: {
        isbn: data.isbn?.trim() || null,
        title: data.title.trim(),
        author: data.author.trim(),
        publisher: data.publisher?.trim() || null,
        publishYear: data.publishYear || null,
        categoryId: data.categoryId,
        rackLocation: data.rackLocation?.trim() || null,
        totalCopies: data.totalCopies,
        availableCopies: data.totalCopies,
        condition: data.condition || 'Baik',
        description: data.description?.trim() || null,
      },
      include: { category: true },
    });

    // Create copies
    for (let i = 1; i <= data.totalCopies; i++) {
      const copyCode = `EX-${category.code}-${book.id.slice(0, 4).toUpperCase()}-${String(i).padStart(2, '0')}`;
      await tx.bookCopy.create({
        data: {
          bookId: book.id,
          copyCode,
          condition: data.condition || 'Baik',
          status: BookCopyStatus.TERSEDIA,
        },
      });
    }

    return book;
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PERPUSTAKAAN',
      action: 'CREATE',
      recordId: newBook.id,
      description: `Menambahkan buku baru: ${newBook.title} (${newBook.totalCopies} eksemplar)`,
      newData: newBook as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: newBook }, { status: 201 });
}
