import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';
import { Semester } from '@prisma/client';
import { z } from 'zod';

const createAcademicYearSchema = z.object({
  name: z.string().regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY (contoh: 2026/2027)'),
  semester: z.nativeEnum(Semester, { message: 'Semester harus GANJIL atau GENAP' }),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createAcademicYearSchema.parse(body);

    // Check duplicate
    const existing = await prisma.academicYear.findUnique({
      where: {
        name_semester: {
          name: data.name,
          semester: data.semester,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Tahun ajaran ${data.name} semester ${data.semester} sudah ada` },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (data.isActive) {
        await tx.academicYear.updateMany({
          data: { isActive: false },
        });
      }

      return await tx.academicYear.create({
        data: {
          name: data.name,
          semester: data.semester,
          isActive: data.isActive,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'SETTINGS',
        action: 'CREATE',
        recordId: created.id,
        description: `Menambahkan tahun ajaran baru: ${created.name} (${created.semester})`,
        newData: JSON.parse(JSON.stringify(created)),
        ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
        userAgent: req.headers.get('user-agent') || 'internal',
      },
    });

    return NextResponse.json({
      message: 'Tahun ajaran berhasil ditambahkan',
      data: created,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Create academic year error:', err);
    return NextResponse.json({ error: 'Gagal menambahkan tahun ajaran' }, { status: 500 });
  }
}
