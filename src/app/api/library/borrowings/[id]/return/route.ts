import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { BookCopyStatus, BorrowingStatus } from '@prisma/client';
import { z } from 'zod';

const returnSchema = z.object({
  fineAmount: z.number().min(0).default(0),
  notes: z.string().max(255).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const borrowing = await prisma.borrowing.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          bookCopy: true,
        },
      },
      member: {
        include: {
          student: true,
          teacher: true,
        },
      },
    },
  });

  if (!borrowing) {
    return NextResponse.json({ error: 'Data peminjaman tidak ditemukan' }, { status: 404 });
  }

  if (borrowing.status === BorrowingStatus.DIKEMBALIKAN) {
    return NextResponse.json({ error: 'Peminjaman ini sudah diselesaikan sebelumnya' }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // optional body
  }

  const parsed = returnSchema.safeParse(body);
  const data = parsed.success ? parsed.data : { fineAmount: 0, notes: null };

  const now = new Date();
  const isLate = now.getTime() > new Date(borrowing.dueDate).getTime();

  // Auto-calculate late days if fine is not manually given
  let calculatedFine = data.fineAmount;
  if (isLate && calculatedFine === 0) {
    const diffTime = Math.abs(now.getTime() - new Date(borrowing.dueDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    calculatedFine = diffDays * 1000; // Rp 1.000 / day
  }

  const finalStatus = isLate ? BorrowingStatus.TERLAMBAT : BorrowingStatus.DIKEMBALIKAN;

  // Execute return in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update Borrowing
    await tx.borrowing.update({
      where: { id },
      data: {
        status: finalStatus,
        returnDate: now,
        fineAmount: calculatedFine,
        notes: data.notes?.trim() || borrowing.notes,
      },
    });

    // 2. Update each item & book copies
    for (const item of borrowing.items) {
      await tx.borrowingItem.update({
        where: { id: item.id },
        data: {
          returnDate: now,
          status: finalStatus,
        },
      });

      await tx.bookCopy.update({
        where: { id: item.bookCopyId },
        data: {
          status: BookCopyStatus.TERSEDIA,
        },
      });

      await tx.book.update({
        where: { id: item.bookCopy.bookId },
        data: {
          availableCopies: { increment: 1 },
        },
      });
    }
  });

  const memberName = borrowing.member.student?.name || borrowing.member.teacher?.name || borrowing.member.memberNumber;

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PERPUSTAKAAN',
      action: 'UPDATE',
      recordId: id,
      description: `Pengembalian buku (${borrowing.borrowingNumber}) oleh ${memberName}. Denda: Rp ${calculatedFine.toLocaleString('id-ID')}`,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    message: 'Buku berhasil dikembalikan ke perpustakaan',
    status: finalStatus,
    fineAmount: calculatedFine,
  });
}
