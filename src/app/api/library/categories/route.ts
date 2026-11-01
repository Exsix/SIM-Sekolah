import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.bookCategory.findMany({
    orderBy: { code: 'asc' },
    include: {
      _count: { select: { books: true } },
    },
  });

  return NextResponse.json({ data: categories });
}
