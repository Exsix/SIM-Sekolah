import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { SessionUser } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('sim_session');

  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let user: SessionUser;
  try {
    user = JSON.parse(session.value) as SessionUser;
  } catch {
    return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
  }

  try {
    // If student or parent, fetch student-specific stats
    let studentStats = null;
    if (user.role === 'SISWA' || user.role === 'ORANG_TUA') {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: user.id },
            ...(user.studentId ? [{ id: user.studentId }] : []),
          ],
        },
        include: {
          class: {
            include: {
              homeroomTeacher: {
                select: { id: true, name: true, nip: true, phone: true },
              },
            },
          },
          parents: {
            include: {
              parent: true,
            },
          },
          attendances: {
            orderBy: { date: 'desc' },
            take: 60,
          },
          grades: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              gradeItem: {
                include: { subject: { select: { name: true } } },
              },
            },
          },
          libraryMember: {
            include: {
              borrowings: { where: { status: 'DIPINJAM' } },
            },
          },
        },
      });

      if (student) {
        const totalAttendances = student.attendances.length;
        const presentCount = student.attendances.filter(
          (a) => a.status === 'HADIR' || a.status === 'DISPENSASI'
        ).length;
        const sickCount = student.attendances.filter((a) => a.status === 'SAKIT').length;
        const permissionCount = student.attendances.filter((a) => a.status === 'IZIN').length;
        const alphaCount = student.attendances.filter((a) => a.status === 'ALPA').length;
        const rate =
          totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 100;

        // Calculate average grade
        const avgScore =
          student.grades.length > 0
            ? Math.round(
                student.grades.reduce((sum, g) => sum + g.score, 0) / student.grades.length
              )
            : 85;

        studentStats = {
          studentId: student.id,
          name: student.name,
          nis: student.nis,
          nisn: student.nisn,
          className: student.class?.name || 'Belum Masuk Kelas',
          homeroomTeacher: student.class?.homeroomTeacher
            ? {
                name: student.class.homeroomTeacher.name,
                phone: student.class.homeroomTeacher.phone || '08123456789',
                nip: student.class.homeroomTeacher.nip,
              }
            : null,
          parents: student.parents.map((sp) => ({
            id: sp.parent.id,
            name: sp.parent.name,
            relationship: sp.parent.relationship,
            phone: sp.parent.phone,
            email: sp.parent.email,
            occupation: sp.parent.occupation,
            address: sp.parent.address,
          })),
          attendanceStats: {
            rate,
            total: totalAttendances,
            present: presentCount,
            sick: sickCount,
            permission: permissionCount,
            alpha: alphaCount,
          },
          attendanceRate: rate,
          avgScore,
          activeBorrowings: student.libraryMember?.borrowings.length || 0,
          recentGrades: student.grades.map((g) => ({
            id: g.id,
            subject: g.gradeItem.subject.name,
            itemName: g.gradeItem.name,
            score: g.score,
            type: g.gradeItem.type,
          })),
        };
      }
    }

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalBooks,
      recentLogs,
      recentAnnouncements,
      activeAcademicYear,
      schoolSetting,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'AKTIF' } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.class.count({ where: { isActive: true } }),
      prisma.subject.count({ where: { isActive: true } }),
      prisma.book.count(),
      user.role === 'SUPER_ADMIN' || user.role === 'KEPALA_SEKOLAH'
        ? prisma.activityLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
          })
        : [],
      prisma.announcement.findMany({
        where: {
          isPublished: true,
          ...(user.role === 'SISWA' || user.role === 'ORANG_TUA'
            ? { targetRole: { in: ['ALL', 'SISWA', 'ORANG_TUA'] } }
            : {}),
          ...(user.role === 'GURU' || user.role === 'WALI_KELAS' ? { targetRole: { in: ['ALL', 'GURU'] } } : {}),
        },
        take: 3,
        orderBy: { publishDate: 'desc' },
        select: {
          id: true,
          title: true,
          targetRole: true,
          publishDate: true,
          authorName: true,
        },
      }),
      prisma.academicYear.findFirst({
        where: { isActive: true },
      }),
      prisma.schoolSetting.findFirst(),
    ]);

    return NextResponse.json({
      role: user.role,
      name: user.name,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalBooks,
      },
      studentStats,
      activeAcademicYear,
      schoolSetting,
      recentLogs,
      recentAnnouncements,
    });
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dashboard' }, { status: 500 });
  }
}
