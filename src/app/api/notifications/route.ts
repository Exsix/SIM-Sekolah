import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Record<string, unknown> = {
    userId: session.id,
  };

  if (unreadOnly) {
    where.isRead = false;
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: {
          userId: session.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal memuat notifikasi' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    if (body.all) {
      // Mark all as read for this user
      await prisma.notification.updateMany({
        where: {
          userId: session.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ message: 'Semua notifikasi ditandai telah dibaca' });
    }

    if (body.id) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: {
          id: body.id,
          userId: session.id,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ message: 'Notifikasi ditandai telah dibaca' });
    }

    return NextResponse.json({ error: 'ID notifikasi atau opsi all diperlukan' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status notifikasi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID notifikasi diperlukan' }, { status: 400 });
  }

  try {
    await prisma.notification.deleteMany({
      where: {
        id,
        userId: session.id,
      },
    });

    return NextResponse.json({ message: 'Notifikasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Gagal menghapus notifikasi' }, { status: 500 });
  }
}
