import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';
import { AchievementCategory, AchievementLevel } from '@prisma/client';

const updateAchievementSchema = z.object({
  studentId: z.string().min(1, 'Siswa wajib dipilih').optional(),
  title: z.string().min(3, 'Nama prestasi minimal 3 karakter').max(200).optional(),
  category: z.nativeEnum(AchievementCategory).optional(),
  level: z.nativeEnum(AchievementLevel).optional(),
  rank: z.string().min(2).max(100).optional(),
  date: z.string().optional(),
  organizer: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional().nullable(),
  proofUrl: z.string().max(500).optional().nullable(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            nisn: true,
            name: true,
            gender: true,
            photoUrl: true,
            class: {
              select: {
                id: true,
                name: true,
                homeroomTeacher: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Data prestasi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(achievement);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail prestasi' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(session.role);

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data prestasi tidak ditemukan' }, { status: 404 });
    }

    // Permission check
    if (!isStaff) {
      // Students can only edit their own UNVERIFIED achievements
      if (session.role === 'SISWA') {
        const student = await prisma.student.findUnique({ where: { userId: session.id } });
        if (existing.studentId !== student?.id) {
          return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
        }
        if (existing.isVerified) {
          return NextResponse.json({ error: 'Prestasi yang sudah diverifikasi tidak dapat diubah' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
    }

    const body = await req.json();
    const validated = updateAchievementSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.level !== undefined) updateData.level = validated.level;
    if (validated.rank !== undefined) updateData.rank = validated.rank;
    if (validated.date !== undefined) updateData.date = new Date(validated.date);
    if (validated.organizer !== undefined) updateData.organizer = validated.organizer;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.proofUrl !== undefined) updateData.proofUrl = validated.proofUrl;

    // Only staff can change studentId, isVerified, and isFeatured
    if (isStaff) {
      if (validated.studentId !== undefined) updateData.studentId = validated.studentId;
      if (validated.isVerified !== undefined) updateData.isVerified = validated.isVerified;
      if (validated.isFeatured !== undefined) updateData.isFeatured = validated.isFeatured;
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'PRESTASI',
        action: 'UPDATE',
        recordId: id,
        description: `Memperbarui prestasi '${updated.title}' (${updated.rank}) untuk ${updated.student.name}`,
        oldData: {
          title: existing.title,
          rank: existing.rank,
          level: existing.level,
          isVerified: existing.isVerified,
        },
        newData: {
          title: updated.title,
          rank: updated.rank,
          level: updated.level,
          isVerified: updated.isVerified,
        },
      },
    });

    return NextResponse.json({
      message: 'Prestasi berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid' }, { status: 400 });
    }
    console.error('Error updating achievement:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data prestasi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(session.role);

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data prestasi tidak ditemukan' }, { status: 404 });
    }

    if (!isStaff) {
      // Students can only delete their own UNVERIFIED submissions
      if (session.role === 'SISWA') {
        const student = await prisma.student.findUnique({ where: { userId: session.id } });
        if (existing.studentId !== student?.id || existing.isVerified) {
          return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
    }

    await prisma.achievement.delete({ where: { id } });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'PRESTASI',
        action: 'DELETE',
        recordId: id,
        description: `Menghapus prestasi '${existing.title}' (${existing.rank}) dari siswa ${existing.student.name}`,
        oldData: {
          title: existing.title,
          studentName: existing.student.name,
          rank: existing.rank,
          level: existing.level,
        },
      },
    });

    return NextResponse.json({ message: 'Prestasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ error: 'Gagal menghapus data prestasi' }, { status: 500 });
  }
}
