import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';

const updateParentContactSchema = z.object({
  parentId: z.string().min(1, 'Parent ID wajib diisi'),
  phone: z.string().min(8, 'Nomor telepon minimal 8 karakter'),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateParentContactSchema.parse(body);

    const existingParent = await prisma.parent.findUnique({
      where: { id: data.parentId },
      include: {
        students: {
          include: { student: true },
        },
      },
    });

    if (!existingParent) {
      return NextResponse.json({ error: 'Data orang tua / wali tidak ditemukan' }, { status: 404 });
    }

    // Security check: If role is SISWA, ensure this parent belongs to the logged-in student
    if (session.role === 'SISWA') {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.id },
            ...(session.studentId ? [{ id: session.studentId }] : []),
          ],
        },
      });

      const isMyParent = existingParent.students.some((sp) => sp.studentId === student?.id);
      if (!isMyParent) {
        return NextResponse.json({ error: 'Anda tidak berhak mengubah data orang tua siswa lain' }, { status: 403 });
      }
    }

    const updated = await prisma.parent.update({
      where: { id: data.parentId },
      data: {
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        occupation: data.occupation?.trim() || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        roleName: session.role,
        module: 'STUDENT',
        action: 'UPDATE',
        recordId: updated.id,
        description: `Memperbarui kontak darurat orang tua/wali: ${updated.name} (${updated.relationship}) - No. HP: ${updated.phone}`,
        oldData: { phone: existingParent.phone, email: existingParent.email },
        newData: { phone: updated.phone, email: updated.email },
        ipAddress: req.headers.get('x-forwarded-for') || 'localhost',
        userAgent: req.headers.get('user-agent') || 'internal',
      },
    });

    return NextResponse.json({
      message: 'Kontak orang tua / wali berhasil diperbarui',
      data: updated,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Update parent contact error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui kontak orang tua' }, { status: 500 });
  }
}
