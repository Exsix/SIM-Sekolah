import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan username atau email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      include: {
        role: true,
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (!user) {
      // Catat log login gagal
      await prisma.activityLog.create({
        data: {
          module: 'AUTH',
          action: 'LOGIN_FAILED',
          description: `Percobaan login gagal untuk identifier: ${identifier} (User tidak ditemukan)`,
        },
      });

      return NextResponse.json(
        { error: 'Username/Email atau kata sandi salah.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator sekolah.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      // Catat log password salah
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          roleName: user.role.name,
          module: 'AUTH',
          action: 'LOGIN_FAILED',
          description: `Kata sandi salah untuk username: ${user.username}`,
        },
      });

      return NextResponse.json(
        { error: 'Username/Email atau kata sandi salah.' },
        { status: 401 }
      );
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Catat log sukses
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        roleName: user.role.name,
        module: 'AUTH',
        action: 'LOGIN_SUCCESS',
        description: `Pengguna ${user.username} berhasil login dengan peran ${user.role.name}`,
      },
    });

    // Simpan session cookie sederhana yang aman
    const sessionPayload = JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role.name,
      name: user.teacher?.name || user.student?.name || user.parent?.name || user.username,
      studentId: user.student?.id || null,
      teacherId: user.teacher?.id || null,
    });

    const cookieStore = await cookies();
    cookieStore.set('sim_session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        name: user.teacher?.name || user.student?.name || user.parent?.name || user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
