import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export function getPredicate(score: number): { predicate: string; description: string } {
  if (score >= 90) return { predicate: 'A', description: 'Sangat Baik' };
  if (score >= 80) return { predicate: 'B', description: 'Baik' };
  if (score >= 70) return { predicate: 'C', description: 'Cukup' };
  return { predicate: 'D', description: 'Perlu Bimbingan' };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  let academicYearId = searchParams.get('academicYearId');

  if (!academicYearId) {
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (activeYear) academicYearId = activeYear.id;
  }

  if (!classId) {
    return NextResponse.json({ error: 'ID kelas wajib diberikan' }, { status: 400 });
  }

  // 1. Fetch Class with Students
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      homeroomTeacher: { select: { id: true, name: true, nip: true } },
      students: {
        where: { status: 'AKTIF' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          nis: true,
          nisn: true,
          name: true,
          gender: true,
          photoUrl: true,
        },
      },
    },
  });

  if (!cls) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  // 2. Fetch all GradeItems in this class & academic year
  const gradeItems = await prisma.gradeItem.findMany({
    where: {
      classId,
      academicYearId: academicYearId || undefined,
    },
    include: {
      subject: { select: { id: true, code: true, name: true, category: true } },
      teacher: { select: { id: true, name: true } },
      grades: true,
    },
    orderBy: [{ subject: { code: 'asc' } }, { createdAt: 'asc' }],
  });

  // Extract unique subjects taught in this class
  const subjectMap = new Map<string, { id: string; code: string; name: string; category: string | null }>();
  for (const gi of gradeItems) {
    if (!subjectMap.has(gi.subject.id)) {
      subjectMap.set(gi.subject.id, gi.subject);
    }
  }
  const subjects = Array.from(subjectMap.values());

  // 3. Compute student score matrix
  // For each student, compute per-subject weighted average and overall average
  const studentRecap = cls.students.map((student) => {
    const subjectScores: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        finalScore: number;
        predicate: string;
        description: string;
        isPassed: boolean;
        itemCount: number;
      }
    > = {};

    let totalWeightedScoreSum = 0;
    let totalWeightSum = 0;
    let subjectsWithScores = 0;

    for (const sub of subjects) {
      // Find all items for this subject
      const itemsForSub = gradeItems.filter((gi) => gi.subjectId === sub.id);
      let subWeightedSum = 0;
      let subWeightSum = 0;
      let validItemCount = 0;

      for (const item of itemsForSub) {
        const studentGrade = item.grades.find((g) => g.studentId === student.id);
        if (studentGrade && studentGrade.score !== null) {
          // Normalize score to 100 scale: (score / maxScore) * 100
          const normalizedScore = (studentGrade.score / item.maxScore) * 100;
          subWeightedSum += normalizedScore * item.weight;
          subWeightSum += item.weight;
          validItemCount++;
        }
      }

      const finalScore = subWeightSum > 0 ? Number((subWeightedSum / subWeightSum).toFixed(1)) : 0;
      const { predicate, description } = getPredicate(finalScore);
      const isPassed = finalScore >= 75; // KKM standard 75

      if (validItemCount > 0) {
        subjectsWithScores++;
        totalWeightedScoreSum += finalScore;
        totalWeightSum += 1;
      }

      subjectScores[sub.id] = {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        finalScore,
        predicate,
        description,
        isPassed,
        itemCount: validItemCount,
      };
    }

    const overallAverage =
      totalWeightSum > 0 ? Number((totalWeightedScoreSum / totalWeightSum).toFixed(2)) : 0;
    const { predicate: overallPredicate, description: overallDescription } = getPredicate(overallAverage);

    return {
      student,
      subjectScores,
      overallAverage,
      overallPredicate,
      overallDescription,
      completedSubjectsCount: subjectsWithScores,
      rank: 0, // will assign next
    };
  });

  // 4. Assign ranks based on overallAverage descending
  studentRecap.sort((a, b) => b.overallAverage - a.overallAverage);
  studentRecap.forEach((sr, idx) => {
    sr.rank = idx + 1;
  });

  // 5. Calculate class summary metrics
  const scoredRecaps = studentRecap.filter((s) => s.completedSubjectsCount > 0);
  const classAverage =
    scoredRecaps.length > 0
      ? Number(
          (scoredRecaps.reduce((acc, s) => acc + s.overallAverage, 0) / scoredRecaps.length).toFixed(1)
        )
      : 0;

  const highestScore = scoredRecaps.length > 0 ? Math.max(...scoredRecaps.map((s) => s.overallAverage)) : 0;
  const lowestScore = scoredRecaps.length > 0 ? Math.min(...scoredRecaps.map((s) => s.overallAverage)) : 0;

  return NextResponse.json({
    data: {
      class: {
        id: cls.id,
        name: cls.name,
        gradeLevel: cls.gradeLevel,
        homeroomTeacher: cls.homeroomTeacher,
        totalStudents: cls.students.length,
      },
      subjects,
      totalGradeItems: gradeItems.length,
      students: studentRecap,
      classStatistics: {
        classAverage,
        highestScore,
        lowestScore,
        totalGradedStudents: scoredRecaps.length,
        passingRate:
          scoredRecaps.length > 0
            ? Math.round(
                (scoredRecaps.filter((s) => s.overallAverage >= 75).length / scoredRecaps.length) * 100
              )
            : 0,
      },
    },
  });
}
