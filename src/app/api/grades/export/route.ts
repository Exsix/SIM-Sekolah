import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import * as XLSX from 'xlsx';
import { getPredicate } from '../recap/route';

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

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: {
        where: { status: 'AKTIF' },
        orderBy: { name: 'asc' },
        select: { id: true, nis: true, nisn: true, name: true },
      },
    },
  });

  if (!cls) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
  }

  const gradeItems = await prisma.gradeItem.findMany({
    where: { classId, academicYearId: academicYearId || undefined },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      grades: true,
    },
  });

  const subjectMap = new Map<string, { id: string; code: string; name: string }>();
  for (const gi of gradeItems) {
    if (!subjectMap.has(gi.subject.id)) {
      subjectMap.set(gi.subject.id, gi.subject);
    }
  }
  const subjects = Array.from(subjectMap.values());

  const rows = cls.students.map((student, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {
      No: idx + 1,
      NIS: student.nis,
      NISN: student.nisn || '-',
      'Nama Siswa': student.name,
      Kelas: cls.name,
    };

    let totalScoreSum = 0;
    let totalSubCount = 0;

    for (const sub of subjects) {
      const itemsForSub = gradeItems.filter((gi) => gi.subjectId === sub.id);
      let subWeightedSum = 0;
      let subWeightSum = 0;

      for (const item of itemsForSub) {
        const g = item.grades.find((gr) => gr.studentId === student.id);
        if (g && g.score !== null) {
          subWeightedSum += ((g.score / item.maxScore) * 100) * item.weight;
          subWeightSum += item.weight;
        }
      }

      const score = subWeightSum > 0 ? Number((subWeightedSum / subWeightSum).toFixed(1)) : 0;
      row[sub.name] = score;

      if (subWeightSum > 0) {
        totalScoreSum += score;
        totalSubCount++;
      }
    }

    const avg = totalSubCount > 0 ? Number((totalScoreSum / totalSubCount).toFixed(2)) : 0;
    row['Rata-Rata Akhir'] = avg;
    row['Predikat'] = getPredicate(avg).predicate;
    row['Status KKM'] = avg >= 75 ? 'Tuntas' : 'Belum Tuntas';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap Nilai ${cls.name}`);

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rekap-nilai-${cls.name.replace(/\s+/g, '-')}.xlsx"`,
    },
  });
}
