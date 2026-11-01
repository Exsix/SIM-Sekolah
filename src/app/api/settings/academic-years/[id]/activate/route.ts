import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const target = await prisma.academicYear.findUnique({
    where: { id },
  });

  if (!target) {
    return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 404 });
  }

  if (target.isActive) {
    return NextResponse.json({ message: 'Tahun ajaran ini sudah berstatus aktif' });
  }

  await prisma.$transaction(async (tx) => {
    // Deactivate all others
    await tx.academicYear.updateMany({
      data: { isActive: false },
    });

    // Activate target
    await tx.academicYear.update({
      where: { id },
      data: { isActive: true },
    });
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      recordId: id,
      description: `Mengaktifkan tahun ajaran: ${target.name} (${target.semester}) sebagai semester berjalan`,
      oldData: { isActive: false },
      newData: { isActive: true },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    message: `Tahun ajaran ${target.name} (${target.semester}) berhasil diaktifkan`,
  });
}
