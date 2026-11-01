import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getPredicate } from '../recap/route';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let studentId = searchParams.get('studentId');

  // If student is logged in, force their studentId
  if (session.role === 'SISWA') {
    const student = await prisma.student.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Data profil siswa tidak ditemukan' }, { status: 404 });
    }
    studentId = student.id;
  }

  if (!studentId) {
    return NextResponse.json({ error: 'ID siswa wajib diberikan' }, { status: 400 });
  }

  // Active academic year
  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  const schoolSetting = await prisma.schoolSetting.findFirst();

  // Fetch student info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          homeroomTeacher: { select: { id: true, name: true, nip: true } },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  // Fetch all grade items for this student's class
  const gradeItems = await prisma.gradeItem.findMany({
    where: {
      classId: student.classId || undefined,
      academicYearId: activeYear?.id,
    },
    include: {
      subject: true,
      teacher: { select: { name: true } },
      grades: {
        where: { studentId },
      },
    },
    orderBy: [{ subject: { code: 'asc' } }, { createdAt: 'asc' }],
  });

  // Group by Subject
  const subjectMap = new Map<
    string,
    {
      subject: { id: string; code: string; name: string; category: string | null };
      teacherName: string;
      items: Array<{
        id: string;
        name: string;
        type: string;
        weight: number;
        maxScore: number;
        score: number | null;
        notes: string | null;
        isPublished: boolean;
      }>;
      finalScore: number;
      predicate: string;
      description: string;
      isPassed: boolean;
    }
  >();

  for (const gi of gradeItems) {
    if (!subjectMap.has(gi.subject.id)) {
      subjectMap.set(gi.subject.id, {
        subject: gi.subject,
        teacherName: gi.teacher.name,
        items: [],
        finalScore: 0,
        predicate: 'D',
        description: 'Belum Dinilai',
        isPassed: false,
      });
    }

    const subData = subjectMap.get(gi.subject.id)!;
    const g = gi.grades[0];
    subData.items.push({
      id: gi.id,
      name: gi.name,
      type: gi.type,
      weight: gi.weight,
      maxScore: gi.maxScore,
      score: g && g.isPublished ? g.score : null,
      notes: g?.notes || null,
      isPublished: g?.isPublished || false,
    });
  }

  // Calculate final score for each subject
  let totalOverallScore = 0;
  let totalOverallSubjects = 0;

  const subjectsReport = Array.from(subjectMap.values()).map((entry) => {
    let weightedSum = 0;
    let weightSum = 0;

    for (const item of entry.items) {
      if (item.score !== null) {
        const normalized = (item.score / item.maxScore) * 100;
        weightedSum += normalized * item.weight;
        weightSum += item.weight;
      }
    }

    const finalScore = weightSum > 0 ? Number((weightedSum / weightSum).toFixed(1)) : 0;
    const { predicate, description } = getPredicate(finalScore);

    if (weightSum > 0) {
      totalOverallScore += finalScore;
      totalOverallSubjects++;
    }

    return {
      ...entry,
      finalScore,
      predicate,
      description,
      isPassed: finalScore >= 75,
    };
  });

  const overallAverage =
    totalOverallSubjects > 0 ? Number((totalOverallScore / totalOverallSubjects).toFixed(2)) : 0;
  const { predicate: overallPredicate, description: overallDescription } = getPredicate(overallAverage);

  // Fetch attendance summary for student
  const attendances = await prisma.studentAttendance.findMany({
    where: { studentId },
    select: { status: true },
  });

  const attendanceRecap = {
    hadir: attendances.filter((a) => a.status === 'HADIR').length,
    sakit: attendances.filter((a) => a.status === 'SAKIT').length,
    izin: attendances.filter((a) => a.status === 'IZIN').length,
    alpa: attendances.filter((a) => a.status === 'ALPA').length,
    dispensasi: attendances.filter((a) => a.status === 'DISPENSASI').length,
    totalHari: attendances.length,
  };

  return NextResponse.json({
    data: {
      school: schoolSetting,
      academicYear: activeYear,
      student: {
        id: student.id,
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        gender: student.gender,
        className: student.class?.name || '-',
        homeroomTeacher: student.class?.homeroomTeacher?.name || '-',
      },
      overallAverage,
      overallPredicate,
      overallDescription,
      attendanceRecap,
      subjects: subjectsReport,
    },
  });
}
