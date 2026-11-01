import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  name: z.string().min(2, 'Nama sekolah minimal 2 karakter'),
  npsn: z.string().min(6, 'NPSN minimal 6 karakter').optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Format email tidak valid').optional().nullable(),
  website: z.string().url('Format URL tidak valid').optional().nullable().or(z.literal('')),
  principalName: z.string().optional().nullable(),
  operationalHours: z.string().optional().nullable(),
  attendanceRules: z.record(z.string(), z.unknown()).optional().nullable(),
  gradingRules: z.record(z.string(), z.unknown()).optional().nullable(),
  libraryRules: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get or create default school setting
  let setting = await prisma.schoolSetting.findFirst();
  if (!setting) {
    setting = await prisma.schoolSetting.create({
      data: {
        id: 'default-school-setting',
        name: 'SMA Negeri 1 Nusantara',
        npsn: '20260001',
        address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
        phone: '021-5551234',
        email: 'info@sman1nusantara.sch.id',
        website: 'https://sman1nusantara.sch.id',
        principalName: 'Dr. H. Ahmad Sudirman, M.Pd.',
        operationalHours: 'Senin - Jumat, 07:00 - 16:00 WIB',
        attendanceRules: {
          lateToleranceMinutes: 15,
          defaultStartTime: '07:00',
          defaultEndTime: '15:30',
        },
        gradingRules: {
          standardKkm: 75,
          weightAssignment: 20,
          weightQuiz: 15,
          weightMidterm: 30,
          weightFinal: 35,
        },
        libraryRules: {
          maxBorrowDays: 7,
          maxBooksPerStudent: 3,
          finePerDay: 1000,
        },
      },
    });
  }

  // Get academic years
  const academicYears = await prisma.academicYear.findMany({
    orderBy: [{ name: 'desc' }, { semester: 'asc' }],
    include: {
      _count: {
        select: {
          classes: true,
          schedules: true,
          gradeItems: true,
        },
      },
    },
  });

  return NextResponse.json({
    setting,
    academicYears,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat mengubah pengaturan sekolah' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateSettingsSchema.parse(body);

    const existing = await prisma.schoolSetting.findFirst();

    const updated = await prisma.schoolSetting.upsert({
      where: { id: existing?.id || 'default-school-setting' },
      update: {
        name: validated.name,
        npsn: validated.npsn || null,
        address: validated.address || null,
        phone: validated.phone || null,
        email: validated.email || null,
        website: validated.website || null,
        principalName: validated.principalName || null,
        operationalHours: validated.operationalHours || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendanceRules: validated.attendanceRules as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gradingRules: validated.gradingRules as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        libraryRules: validated.libraryRules as any,
      },
      create: {
        id: 'default-school-setting',
        name: validated.name,
        npsn: validated.npsn || null,
        address: validated.address || null,
        phone: validated.phone || null,
        email: validated.email || null,
        website: validated.website || null,
        principalName: validated.principalName || null,
        operationalHours: validated.operationalHours || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendanceRules: validated.attendanceRules as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gradingRules: validated.gradingRules as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        libraryRules: validated.libraryRules as any,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'SETTINGS',
        action: 'UPDATE',
        recordId: updated.id,
        description: `Memperbarui konfigurasi profil dan aturan operasional sekolah (${updated.name})`,
        oldData: existing ? JSON.parse(JSON.stringify(existing)) : null,
        newData: JSON.parse(JSON.stringify(updated)),
        ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
        userAgent: req.headers.get('user-agent') || 'internal',
      },
    });

    return NextResponse.json({
      message: 'Pengaturan sekolah berhasil disimpan',
      data: updated,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Settings error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
