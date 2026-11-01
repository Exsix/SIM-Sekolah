import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const cookieStore = await cookies();
  const session = cookieStore.get('sim_session');

  if (session?.value) {
    try {
      const user = JSON.parse(session.value);
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          roleName: user.role,
          module: 'AUTH',
          action: 'LOGOUT',
          description: `Pengguna ${user.username} telah logout`,
        },
      });
    } catch {
      // ignore
    }
  }

  cookieStore.delete('sim_session');
  return NextResponse.json({ success: true, message: 'Berhasil keluar.' });
}
