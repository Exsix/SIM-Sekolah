import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { AssessmentType } from '@prisma/client';
import { z } from 'zod';

const createGradeItemSchema = z.object({
  name: z.string().min(2, 'Nama penilaian minimal 2 karakter').max(100),
  type: z.nativeEnum(AssessmentType, {
    message: 'Tipe penilaian tidak valid',
  }),
  weight: z.number().min(0.1, 'Bobot minimal 0.1').default(1.0),
  maxScore: z.number().min(10, 'Skor maksimal minimal 10').max(1000).default(100.0),
  academicYearId: z.string().optional(),
  subjectId: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  classId: z.string().min(1, 'Kelas wajib dipilih'),
  teacherId: z.string().min(1, 'Guru penilai wajib dipilih'),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');
  const teacherId = searchParams.get('teacherId');
  const type = searchParams.get('type');
  let academicYearId = searchParams.get('academicYearId');

  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (activeYear) academicYearId = activeYear.id;
  }

  const where: Record<string, unknown> = {};
  if (academicYearId) where.academicYearId = academicYearId;
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (type && Object.values(AssessmentType).includes(type as AssessmentType)) {
    where.type = type as AssessmentType;
  }

  const items = await prisma.gradeItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      class: { select: { id: true, name: true, gradeLevel: true } },
      subject: { select: { id: true, name: true, code: true, category: true } },
      teacher: { select: { id: true, name: true, nip: true, photoUrl: true } },
      academicYear: { select: { id: true, name: true, semester: true } },
      grades: {
        select: {
          id: true,
          score: true,
          isPublished: true,
        },
      },
      _count: {
        select: { grades: true },
      },
    },
  });

  // Calculate statistics for each item (average, count)
  const itemsWithStats = items.map((item) => {
    const totalScores = item.grades.reduce((sum, g) => sum + g.score, 0);
    const avgScore = item.grades.length > 0 ? Number((totalScores / item.grades.length).toFixed(1)) : 0;
    return {
      ...item,
      stats: {
        totalGraded: item.grades.length,
        averageScore: avgScore,
        publishedCount: item.grades.filter((g) => g.isPublished).length,
      },
    };
  });

  return NextResponse.json({ data: itemsWithStats });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = createGradeItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  let academicYearId = data.academicYearId;
  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return NextResponse.json({ error: 'Tahun akademik aktif tidak ditemukan' }, { status: 400 });
    academicYearId = activeYear.id;
  }

  const newGradeItem = await prisma.gradeItem.create({
    data: {
      name: data.name.trim(),
      type: data.type,
      weight: data.weight,
      maxScore: data.maxScore,
      academicYearId,
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true, code: true } },
      teacher: { select: { name: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENILAIAN',
      action: 'CREATE',
      recordId: newGradeItem.id,
      description: `Membuat komponen penilaian baru: ${newGradeItem.name} (${newGradeItem.type}) untuk ${newGradeItem.subject.name} di ${newGradeItem.class.name}`,
      newData: newGradeItem as object,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({ data: newGradeItem }, { status: 201 });
}
