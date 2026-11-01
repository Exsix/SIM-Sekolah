import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';
import { AchievementCategory, AchievementLevel } from '@prisma/client';

const createAchievementSchema = z.object({
  studentId: z.string().min(1, 'Siswa wajib dipilih'),
  title: z.string().min(3, 'Nama prestasi/kejuaraan minimal 3 karakter').max(200),
  category: z.nativeEnum(AchievementCategory),
  level: z.nativeEnum(AchievementLevel),
  rank: z.string().min(2, 'Peringkat atau capaian juara wajib diisi').max(100),
  date: z.string().min(1, 'Tanggal perolehan wajib diisi'),
  organizer: z.string().min(2, 'Penyelenggara wajib diisi').max(150),
  description: z.string().max(1000).optional().nullable(),
  proofUrl: z.string().max(500).optional().nullable(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category');
  const level = searchParams.get('level');
  const studentId = searchParams.get('studentId');
  const isVerified = searchParams.get('isVerified');
  const isFeatured = searchParams.get('isFeatured');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '30');
  const skip = (page - 1) * limit;

  // Build where filter
  const where: Record<string, unknown> = {};

  if (category && Object.values(AchievementCategory).includes(category as AchievementCategory)) {
    where.category = category as AchievementCategory;
  }

  if (level && Object.values(AchievementLevel).includes(level as AchievementLevel)) {
    where.level = level as AchievementLevel;
  }

  if (isFeatured !== null && isFeatured !== '') {
    where.isFeatured = isFeatured === 'true';
  }

  // Role visibility logic
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(session.role);

  if (session.role === 'SISWA') {
    // Siswa can filter by their own studentId to see unverified submissions,
    // OR see all verified achievements across the school
    if (studentId) {
      where.studentId = studentId;
      if (isVerified !== null && isVerified !== '') {
        where.isVerified = isVerified === 'true';
      }
    } else {
      // By default show all verified achievements
      where.isVerified = true;
    }
  } else {
    // Staff can filter by studentId and isVerified freely
    if (studentId) where.studentId = studentId;
    if (isVerified !== null && isVerified !== '') {
      where.isVerified = isVerified === 'true';
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { rank: { contains: search, mode: 'insensitive' } },
      { organizer: { contains: search, mode: 'insensitive' } },
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { student: { nis: { contains: search, mode: 'insensitive' } } },
    ];
  }

  try {
    const [achievements, total, statsAll] = await Promise.all([
      prisma.achievement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { date: 'desc' }],
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
                },
              },
            },
          },
        },
      }),
      prisma.achievement.count({ where }),
      prisma.achievement.findMany({
        select: {
          id: true,
          level: true,
          category: true,
          isVerified: true,
          isFeatured: true,
        },
      }),
    ]);

    // Aggregate statistics
    const stats = {
      total: statsAll.length,
      verified: statsAll.filter((a) => a.isVerified).length,
      unverified: statsAll.filter((a) => !a.isVerified).length,
      featured: statsAll.filter((a) => a.isFeatured).length,
      nationalInternational: statsAll.filter(
        (a) => a.level === 'NASIONAL' || a.level === 'INTERNASIONAL'
      ).length,
      categoryCounts: {
        AKADEMIK: statsAll.filter((a) => a.category === 'AKADEMIK').length,
        SAINS_TEKNOLOGI: statsAll.filter((a) => a.category === 'SAINS_TEKNOLOGI').length,
        OLAHRAGA: statsAll.filter((a) => a.category === 'OLAHRAGA').length,
        SENI: statsAll.filter((a) => a.category === 'SENI').length,
        KEAGAMAAN: statsAll.filter((a) => a.category === 'KEAGAMAAN').length,
        ORGANISASI: statsAll.filter((a) => a.category === 'ORGANISASI').length,
        LAINNYA: statsAll.filter((a) => a.category === 'LAINNYA').length,
      },
    };

    return NextResponse.json({
      data: achievements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Gagal memuat data prestasi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = createAchievementSchema.parse(body);

    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(session.role);

    let targetStudentId = validated.studentId;
    let isVerified = false;
    let isFeatured = false;

    if (!isStaff) {
      // If student or parent, verify they are submitting for themselves
      if (session.role === 'SISWA') {
        const student = await prisma.student.findUnique({
          where: { userId: session.id },
          select: { id: true },
        });
        if (!student) {
          return NextResponse.json({ error: 'Profil siswa tidak ditemukan' }, { status: 404 });
        }
        targetStudentId = student.id;
      }
      isVerified = false; // Students cannot verify their own achievements
      isFeatured = false;
    } else {
      isVerified = validated.isVerified ?? true;
      isFeatured = validated.isFeatured ?? false;
    }

    const dateVal = new Date(validated.date);

    const achievement = await prisma.achievement.create({
      data: {
        studentId: targetStudentId,
        title: validated.title,
        category: validated.category,
        level: validated.level,
        rank: validated.rank,
        date: dateVal,
        organizer: validated.organizer,
        description: validated.description || null,
        proofUrl: validated.proofUrl || null,
        isVerified,
        isFeatured,
      },
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

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'PRESTASI',
        action: 'CREATE',
        recordId: achievement.id,
        description: `Mencatat prestasi '${achievement.title}' (${achievement.rank}) untuk siswa ${achievement.student.name}`,
        newData: {
          title: achievement.title,
          studentName: achievement.student.name,
          category: achievement.category,
          level: achievement.level,
          isVerified: achievement.isVerified,
        },
      },
    });

    return NextResponse.json({
      message: isVerified
        ? 'Prestasi berhasil dicatat dan diverifikasi'
        : 'Prestasi berhasil diajukan, menunggu verifikasi pihak kesiswaan',
      data: achievement,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid' }, { status: 400 });
    }
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data prestasi' }, { status: 500 });
  }
}
