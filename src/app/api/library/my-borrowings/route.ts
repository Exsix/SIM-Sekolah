import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Resolve memberId from session
  let member = await prisma.libraryMember.findFirst({
    where: { userId: session.id },
  });

  if (!member && session.role === 'SISWA') {
    const student = await prisma.student.findFirst({ where: { userId: session.id } });
    if (student) {
      member = await prisma.libraryMember.findUnique({ where: { studentId: student.id } });
    }
  } else if (!member && (session.role === 'GURU' || session.role === 'WALI_KELAS')) {
    const teacher = await prisma.teacher.findFirst({ where: { userId: session.id } });
    if (teacher) {
      member = await prisma.libraryMember.findUnique({ where: { teacherId: teacher.id } });
    }
  }

  if (!member) {
    return NextResponse.json({
      data: {
        activeLoans: [],
        historyLoans: [],
        stats: { totalBorrowed: 0, activeCount: 0, totalFine: 0 },
      },
    });
  }

  const borrowings = await prisma.borrowing.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: 'desc' },
    include: {
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

  const activeLoans = borrowings.filter((b) => b.status === 'DIPINJAM');
  const historyLoans = borrowings.filter((b) => b.status !== 'DIPINJAM');
  const totalFine = borrowings.reduce((sum, b) => sum + (b.fineAmount || 0), 0);

  return NextResponse.json({
    data: {
      member,
      activeLoans,
      historyLoans,
      stats: {
        totalBorrowed: borrowings.length,
        activeCount: activeLoans.length,
        totalFine,
      },
    },
  });
}
