import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(session.role);
  if (!isStaff) {
    return NextResponse.json({ error: 'Akses ditolak: Hanya pendidik atau administrator yang dapat memverifikasi prestasi' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id },
      include: {
        student: { select: { name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prestasi tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: { isVerified?: boolean; isFeatured?: boolean } = {};

    if (typeof body.isVerified === 'boolean') {
      updateData.isVerified = body.isVerified;
    }
    if (typeof body.isFeatured === 'boolean') {
      updateData.isFeatured = body.isFeatured;
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'PRESTASI',
        action: 'UPDATE',
        recordId: id,
        description: `Mengubah status verifikasi prestasi '${existing.title}' milik ${existing.student.name} menjadi ${updated.isVerified ? 'TERVERIFIKASI' : 'BELUM DIVERIFIKASI'} (Unggulan: ${updated.isFeatured ? 'Ya' : 'Tidak'})`,
      },
    });

    return NextResponse.json({
      message: 'Status prestasi berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Error toggling achievement verification:', error);
    return NextResponse.json({ error: 'Gagal memperbarui verifikasi prestasi' }, { status: 500 });
  }
}
