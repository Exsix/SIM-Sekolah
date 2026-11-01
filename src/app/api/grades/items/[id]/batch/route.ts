import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, STAFF_ROLES } from '@/lib/session';
import { z } from 'zod';

const batchGradeSchema = z.object({
  isPublished: z.boolean().default(true),
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      score: z.number().min(0, 'Nilai minimal 0').max(1000, 'Nilai melebihi batas maksimal'),
      notes: z.string().max(255).optional().nullable(),
    })
  ),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const gradeItem = await prisma.gradeItem.findUnique({
    where: { id },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  if (!gradeItem) {
    return NextResponse.json({ error: 'Komponen penilaian tidak ditemukan' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = batchGradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 422 });
  }

  const { grades, isPublished } = parsed.data;

  // Validate scores against maxScore
  for (const g of grades) {
    if (g.score > gradeItem.maxScore) {
      return NextResponse.json(
        { error: `Skor ${g.score} melebihi skor maksimal (${gradeItem.maxScore})` },
        { status: 400 }
      );
    }
  }

  const now = new Date();

  // Execute batch upsert inside transaction
  await prisma.$transaction(async (tx) => {
    for (const g of grades) {
      await tx.grade.upsert({
        where: {
          studentId_gradeItemId: {
            studentId: g.studentId,
            gradeItemId: id,
          },
        },
        update: {
          score: g.score,
          notes: g.notes?.trim() || null,
          isPublished,
          publishedAt: isPublished ? now : null,
        },
        create: {
          studentId: g.studentId,
          gradeItemId: id,
          score: g.score,
          notes: g.notes?.trim() || null,
          isPublished,
          publishedAt: isPublished ? now : null,
        },
      });
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      roleName: session.role,
      module: 'PENILAIAN',
      action: 'UPDATE',
      recordId: id,
      description: `Menginput/memperbarui ${grades.length} nilai siswa untuk ${gradeItem.name} (${gradeItem.subject.name} - ${gradeItem.class.name})`,
      ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
      userAgent: req.headers.get('user-agent') || 'internal',
    },
  });

  return NextResponse.json({
    message: `Berhasil menyimpan ${grades.length} nilai siswa`,
    totalSaved: grades.length,
    isPublished,
  });
}
