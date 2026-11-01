import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { BookCopyStatus, BorrowingStatus } from '@prisma/client';
import { z } from 'zod';

const createBorrowingSchema = z.object({
  memberId: z.string().min(1, 'Anggota perpustakaan wajib dipilih'),
  copyIds: z.array(z.string().min(1)).min(1, 'Pilih minimal 1 eksemplar buku'),
  dueDate: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
  notes: z.string().max(255).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const memberId = searchParams.get('memberId');
  const search = searchParams.get('search') || '';

  const where: Record<string, unknown> = {};

  if (status && Object.values(BorrowingStatus).includes(status as BorrowingStatus)) {
    where.status = status as BorrowingStatus;
  }
  if (memberId) where.memberId = memberId;

  if (search) {
    where.OR = [
      { borrowingNumber: { contains: search, mode: 'insensitive' } },
      { member: { memberNumber: { contains: search, mode: 'insensitive' } } },
      { member: { student: { name: { contains: search, mode: 'insensitive' } } } },
      { member: { teacher: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const borrowings = await prisma.borrowing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      member: {
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              name: true,
              class: { select: { name: true } },
            },
          },
          teacher: {
            select: {
              id: true,
              nip: true,
              name: true,
              position: true,
            },
          },
        },
      },
      items: {
        include: {
          bookCopy: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  isbn: true,
                  rackLocation: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ data: borrowings });
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

  const parsed = createBorrowingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const { memberId, copyIds, dueDate, notes } = parsed.data;

  // Validate member
  const member = await prisma.libraryMember.findUnique({
    where: { id: memberId },
    include: { student: true, teacher: true },
  });
  if (!member) {
    return NextResponse.json({ error: 'Anggota perpustakaan tidak ditemukan' }, { status: 404 });
  }

  // Validate that copies exist and are TERSEDIA
  const copies = await prisma.bookCopy.findMany({
    where: { id: { in: copyIds } },
    include: { book: true },
  });

  if (copies.length !== copyIds.length) {
    return NextResponse.json({ error: 'Satu atau lebih eksemplar buku tidak ditemukan' }, { status: 404 });
  }

  for (const c of copies) {
    if (c.status !== BookCopyStatus.TERSEDIA) {
      return NextResponse.json(
        { error: `Buku "${c.book.title}" (${c.copyCode}) sedang tidak tersedia (status: ${c.status})` },
        { status: 400 }
      );
    }
  }

  // Generate unique borrowing number
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.borrowing.count({
    where: {
      borrowingNumber: { startsWith: `PINJAM-${todayStr}` },
    },
  });
  const borrowingNumber = `PINJAM-${todayStr}-${String(countToday + 1).padStart(4, '0')}`;

  const borrowDate = new Date();
  const parsedDueDate = new Date(dueDate);

  // Execute borrowing transaction
  const borrowing = await prisma.$transaction(async (tx) => {
    const b = await tx.borrowing.create({
      data: {
        borrowingNumber,
        memberId,
        borrowDate,
        dueDate: parsedDueDate,
        status: BorrowingStatus.DIPINJAM,
        notes: notes?.trim() || null,
      },
    });

    for (const copy of copies) {
      await tx.borrowingItem.create({
        data: {
          borrowingId: b.id,
          bookCopyId: copy.id,
          status: BorrowingStatus.DIPINJAM,
        },
      });

      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: BookCopyStatus.DIPINJAM },
      });

      await tx.book.update({
        where: { id: copy.bookId },
        data: { availableCopies: { decrement: 1 } },
      });
    }

    return b;
  });

  const memberName = member.student?.name || member.teacher?.name || member.memberNumber;

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PERPUSTAKAAN',
      action: 'CREATE',
      recordId: borrowing.id,
      description: `Mencatat peminjaman ${copies.length} buku (${borrowing.borrowingNumber}) oleh ${memberName}`,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: borrowing }, { status: 201 });
}
