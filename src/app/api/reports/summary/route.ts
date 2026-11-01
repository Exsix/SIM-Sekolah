import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...ADMIN_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const classIdParam = searchParams.get('classId');

  const [
    setting,
    classes,
    totalStudents,
    maleStudents,
    femaleStudents,
    studentsByClass,
    teachers,
    studentAttendances,
    teacherAttendances,
    grades,
    books,
    borrowings,
  ] = await Promise.all([
    prisma.schoolSetting.findFirst(),
    prisma.class.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        capacity: true,
        homeroomTeacher: { select: { name: true } },
        _count: { select: { students: true } },
      },
    }),
    prisma.student.count({ where: { status: 'AKTIF' } }),
    prisma.student.count({ where: { status: 'AKTIF', gender: 'LAKI_LAKI' } }),
    prisma.student.count({ where: { status: 'AKTIF', gender: 'PEREMPUAN' } }),
    prisma.class.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            students: { where: { status: 'AKTIF' } },
          },
        },
      },
    }),
    prisma.teacher.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        employmentStatus: true,
        gender: true,
      },
    }),
    prisma.studentAttendance.findMany({
      select: {
        id: true,
        classId: true,
        status: true,
      },
    }),
    prisma.teacherAttendance.findMany({
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.grade.findMany({
      where: classIdParam ? { student: { classId: classIdParam } } : {},
      select: {
        id: true,
        score: true,
        student: { select: { classId: true } },
        gradeItem: {
          select: {
            id: true,
            name: true,
            type: true,
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
    }),
    prisma.book.findMany({
      select: {
        id: true,
        title: true,
        totalCopies: true,
        availableCopies: true,
        copies: {
          select: {
            borrowingItems: { select: { id: true } },
          },
        },
      },
    }),
    prisma.borrowing.findMany({
      select: {
        id: true,
        status: true,
        fineAmount: true,
      },
    }),
  ]);

  // 1. Student Demographics
  const classBreakdown = studentsByClass.map((c) => ({
    classId: c.id,
    className: c.name,
    studentCount: c._count.students,
  }));

  // 2. Teacher Employment Breakdown
  const pnsTeachers = teachers.filter((t) => t.employmentStatus === 'PNS').length;
  const pppkTeachers = teachers.filter((t) => t.employmentStatus === 'PPPK').length;
  const honorerTeachers = teachers.filter(
    (t) => t.employmentStatus === 'GURU_HONORER' || t.employmentStatus === 'GURU_TETAP_YAYASAN' || !t.employmentStatus
  ).length;

  // 3. Attendance Rate Calculations
  const totalStudentAtt = studentAttendances.length;
  const studentPresentCount = studentAttendances.filter((a) => a.status === 'HADIR' || a.status === 'DISPENSASI').length;
  const studentSickCount = studentAttendances.filter((a) => a.status === 'SAKIT').length;
  const studentPermCount = studentAttendances.filter((a) => a.status === 'IZIN').length;
  const studentAlphaCount = studentAttendances.filter((a) => a.status === 'ALPA').length;
  const studentAttendanceRate = totalStudentAtt > 0 ? Math.round((studentPresentCount / totalStudentAtt) * 100) : 100;

  // Class Attendance breakdown
  const classAttendanceMap = new Map<string, { total: number; present: number; sick: number; perm: number; alpha: number }>();
  for (const a of studentAttendances) {
    const current = classAttendanceMap.get(a.classId) || { total: 0, present: 0, sick: 0, perm: 0, alpha: 0 };
    current.total++;
    if (a.status === 'HADIR' || a.status === 'DISPENSASI') current.present++;
    else if (a.status === 'SAKIT') current.sick++;
    else if (a.status === 'IZIN') current.perm++;
    else if (a.status === 'ALPA') current.alpha++;
    classAttendanceMap.set(a.classId, current);
  }

  const classAttendanceRecap = classes.map((c) => {
    const att = classAttendanceMap.get(c.id) || { total: 0, present: 0, sick: 0, perm: 0, alpha: 0 };
    const rate = att.total > 0 ? Math.round((att.present / att.total) * 100) : 100;
    return {
      classId: c.id,
      className: c.name,
      homeroomTeacher: c.homeroomTeacher?.name || '-',
      studentCount: c._count.students,
      attendanceRate: rate,
      present: att.present,
      sick: att.sick,
      perm: att.perm,
      alpha: att.alpha,
    };
  });

  const totalTeacherAtt = teacherAttendances.length;
  const teacherPresentCount = teacherAttendances.filter((a) => a.status === 'HADIR' || a.status === 'DISPENSASI').length;
  const teacherAttendanceRate = totalTeacherAtt > 0 ? Math.round((teacherPresentCount / totalTeacherAtt) * 100) : 100;

  // 4. Grade Leger & Subject Performance
  const totalGrades = grades.length;
  const avgSchoolScore = totalGrades > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / totalGrades) : 85;

  let gradeRangeA = 0; // >= 88
  let gradeRangeB = 0; // 75 - 87
  let gradeRangeC = 0; // 60 - 74
  let gradeRangeD = 0; // < 60

  for (const g of grades) {
    if (g.score >= 88) gradeRangeA++;
    else if (g.score >= 75) gradeRangeB++;
    else if (g.score >= 60) gradeRangeC++;
    else gradeRangeD++;
  }

  // Subject performance map
  const subjectMap = new Map<string, { code: string; name: string; totalScore: number; count: number; passedCount: number }>();
  for (const g of grades) {
    const sub = g.gradeItem.subject;
    const current = subjectMap.get(sub.id) || { code: sub.code, name: sub.name, totalScore: 0, count: 0, passedCount: 0 };
    current.totalScore += g.score;
    current.count++;
    if (g.score >= 75) current.passedCount++;
    subjectMap.set(sub.id, current);
  }

  const subjectPerformance = Array.from(subjectMap.values()).map((s) => ({
    code: s.code,
    name: s.name,
    average: s.count > 0 ? Math.round(s.totalScore / s.count) : 0,
    totalAssessments: s.count,
    passRate: s.count > 0 ? Math.round((s.passedCount / s.count) * 100) : 100,
  }));

  // 5. Library Statistics
  const totalBookTitles = books.length;
  const totalPhysicalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalBorrowedCopies = books.reduce((sum, b) => sum + (b.totalCopies - b.availableCopies), 0);
  const activeLoans = borrowings.filter((b) => b.status === 'DIPINJAM').length;
  const totalFines = borrowings.reduce((sum, b) => sum + (b.fineAmount || 0), 0);

  // Top borrowed books
  const topBooks = books
    .map((b) => ({
      title: b.title,
      borrowCount: b.copies.reduce((sum, c) => sum + (c.borrowingItems ? c.borrowingItems.length : 0), 0),
    }))
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 5);

  return NextResponse.json({
    school: {
      name: setting?.name || 'SMA Negeri 1 Nusantara',
      npsn: setting?.npsn || '20260001',
      principalName: setting?.principalName || 'Dr. H. Ahmad Sudirman, M.Pd.',
      address: setting?.address || 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
    },
    students: {
      total: totalStudents,
      male: maleStudents,
      female: femaleStudents,
      classBreakdown,
    },
    teachers: {
      total: teachers.length,
      pns: pnsTeachers,
      pppk: pppkTeachers,
      honorer: honorerTeachers,
    },
    attendance: {
      studentRate: studentAttendanceRate,
      teacherRate: teacherAttendanceRate,
      studentStats: {
        total: totalStudentAtt,
        present: studentPresentCount,
        sick: studentSickCount,
        perm: studentPermCount,
        alpha: studentAlphaCount,
      },
      classRecap: classAttendanceRecap,
    },
    grades: {
      averageScore: avgSchoolScore,
      totalAssessments: totalGrades,
      distribution: {
        A: gradeRangeA,
        B: gradeRangeB,
        C: gradeRangeC,
        D: gradeRangeD,
      },
      passRate: totalGrades > 0 ? Math.round(((gradeRangeA + gradeRangeB) / totalGrades) * 100) : 100,
      subjectPerformance,
    },
    library: {
      totalTitles: totalBookTitles,
      totalPhysicalCopies,
      totalBorrowedCopies,
      activeLoans,
      totalFines,
      topBooks,
    },
  });
}
