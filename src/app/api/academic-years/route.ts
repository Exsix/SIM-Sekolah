import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const academicYears = await prisma.academicYear.findMany({
    orderBy: [{ name: 'desc' }, { semester: 'asc' }],
    select: {
      id: true,
      name: true,
      semester: true,
      isActive: true,
      startDate: true,
      endDate: true,
    },
  });

  return NextResponse.json({ data: academicYears });
}
