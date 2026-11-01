import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles } from '@/lib/session';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ['SUPER_ADMIN'])) {
    return NextResponse.json({ error: 'Hanya Super Administrator yang dapat mengubah status akun' }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json({ error: 'Anda tidak dapat mengunci akun Anda sendiri' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }

  const newStatus = !targetUser.isActive;

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: newStatus },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'SECURITY',
      action: 'UPDATE',
      recordId: id,
      description: `${newStatus ? 'Mengaktifkan kembali' : 'Mengunci / memblokir'} akun pengguna: ${targetUser.username} (${targetUser.role.name})`,
      oldData: { isActive: targetUser.isActive },
      newData: { isActive: newStatus },
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    message: `Akun ${targetUser.username} berhasil ${newStatus ? 'diaktifkan' : 'dikunci'}`,
    isActive: newStatus,
  });
}
