import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const where: Record<string, unknown> = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { memberNumber: { contains: search, mode: 'insensitive' } },
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { student: { nis: { contains: search, mode: 'insensitive' } } },
      { teacher: { name: { contains: search, mode: 'insensitive' } } },
      { teacher: { nip: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const members = await prisma.libraryMember.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, name: true, nis: true, class: { select: { name: true } } } },
      teacher: { select: { id: true, name: true, nip: true, position: true } },
      _count: {
        select: {
          borrowings: {
            where: { status: 'DIPINJAM' },
          },
        },
      },
    },
  });

  return NextResponse.json({ data: members });
}
