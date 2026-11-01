import { PrismaClient, AssessmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGrades() {
  console.log('Seeding grade items and student scores...');

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  if (!activeYear) {
    console.error('No active academic year');
    return;
  }

  const classX1 = await prisma.class.findFirst({
    where: { name: { contains: 'X MIPA 1' } },
    include: {
      students: { where: { status: 'AKTIF' } },
    },
  });

  if (!classX1) {
    console.error('Class X MIPA 1 not found');
    return;
  }

  const teachers = await prisma.teacher.findMany();
  const getTeacher = (nameSnippet: string) =>
    teachers.find((t) => t.name.toLowerCase().includes(nameSnippet.toLowerCase()));

  const fauzi = getTeacher('Fauzi');
  const wahyuni = getTeacher('Wahyuni');
  const dewi = getTeacher('Dewi') || getTeacher('Lestari');
  const rini = getTeacher('Rini');
  const budi = getTeacher('Budi') || getTeacher('Hendra');
  const nurul = getTeacher('Nurul');
  const rizal = getTeacher('Rizal');

  const subjects = await prisma.subject.findMany();
  const getSubject = (code: string) => subjects.find((s) => s.code === code);

  const mtk10 = getSubject('MTK-10');
  const bin10 = getSubject('BIN-10');
  const big10 = getSubject('BIG-10');
  const bio10 = getSubject('BIO-10');
  const inf10 = getSubject('INF-10');
  const pai10 = getSubject('PAI-10');
  const pjk10 = getSubject('PJK-10');

  // List of assessments to seed
  const assessments = [
    // Matematika (Drs. Ahmad Fauzi)
    {
      name: 'Tugas 1: Sistem Persamaan Linear Tiga Variabel',
      type: AssessmentType.TUGAS,
      weight: 1.0,
      maxScore: 100,
      sub: mtk10,
      teacher: fauzi,
      baseScore: 85,
    },
    {
      name: 'Kuis 1: Matriks & Determinan',
      type: AssessmentType.KUIS,
      weight: 1.5,
      maxScore: 100,
      sub: mtk10,
      teacher: fauzi,
      baseScore: 82,
    },
    {
      name: 'Penilaian Tengah Semester (PTS) Matematika',
      type: AssessmentType.UTS,
      weight: 2.5,
      maxScore: 100,
      sub: mtk10,
      teacher: fauzi,
      baseScore: 88,
    },
    // Bahasa Indonesia (Dra. Sri Wahyuni)
    {
      name: 'Tugas 1: Analisis Struktur Teks Laporan Hasil Observasi',
      type: AssessmentType.TUGAS,
      weight: 1.0,
      maxScore: 100,
      sub: bin10,
      teacher: wahyuni,
      baseScore: 90,
    },
    {
      name: 'Penilaian Tengah Semester (PTS) Bahasa Indonesia',
      type: AssessmentType.UTS,
      weight: 2.5,
      maxScore: 100,
      sub: bin10,
      teacher: wahyuni,
      baseScore: 86,
    },
    // Bahasa Inggris (Dewi Lestari)
    {
      name: 'Task 1: Descriptive Text Writing',
      type: AssessmentType.TUGAS,
      weight: 1.0,
      maxScore: 100,
      sub: big10,
      teacher: dewi,
      baseScore: 88,
    },
    {
      name: 'Mid-Semester Exam (PTS) English',
      type: AssessmentType.UTS,
      weight: 2.5,
      maxScore: 100,
      sub: big10,
      teacher: dewi,
      baseScore: 84,
    },
    // Biologi (Rini Puspitasari)
    {
      name: 'Praktikum 1: Pengamatan Sel Bawang Merah & Daun',
      type: AssessmentType.PRAKTIK,
      weight: 1.5,
      maxScore: 100,
      sub: bio10,
      teacher: rini,
      baseScore: 92,
    },
    {
      name: 'Penilaian Tengah Semester (PTS) Biologi',
      type: AssessmentType.UTS,
      weight: 2.5,
      maxScore: 100,
      sub: bio10,
      teacher: rini,
      baseScore: 85,
    },
    // Informatika (Budi Santoso / Hendra)
    {
      name: 'Proyek 1: Algoritma & Pemrograman Python Dasar',
      type: AssessmentType.PROYEK,
      weight: 2.0,
      maxScore: 100,
      sub: inf10,
      teacher: budi,
      baseScore: 94,
    },
    {
      name: 'Penilaian Tengah Semester (PTS) Informatika',
      type: AssessmentType.UTS,
      weight: 2.5,
      maxScore: 100,
      sub: inf10,
      teacher: budi,
      baseScore: 90,
    },
    // PAI (Nurul Hidayah)
    {
      name: 'Ulangan Harian 1: Makna Kejujuran & Menuntut Ilmu',
      type: AssessmentType.ULANGAN,
      weight: 1.5,
      maxScore: 100,
      sub: pai10,
      teacher: nurul,
      baseScore: 88,
    },
    // PJOK (Rizal Maulana)
    {
      name: 'Praktik 1: Kebugaran Jasmani & Senam Lantai',
      type: AssessmentType.PRAKTIK,
      weight: 2.0,
      maxScore: 100,
      sub: pjk10,
      teacher: rizal,
      baseScore: 89,
    },
  ];

  for (const a of assessments) {
    if (a.sub && a.teacher) {
      let gradeItem = await prisma.gradeItem.findFirst({
        where: {
          classId: classX1.id,
          subjectId: a.sub.id,
          name: a.name,
        },
      });

      if (!gradeItem) {
        gradeItem = await prisma.gradeItem.create({
          data: {
            name: a.name,
            type: a.type,
            weight: a.weight,
            maxScore: a.maxScore,
            academicYearId: activeYear.id,
            classId: classX1.id,
            subjectId: a.sub.id,
            teacherId: a.teacher.id,
          },
        });
        console.log(`Created grade item: ${gradeItem.name}`);
      }

      // Seed student scores with slight variation
      for (let i = 0; i < classX1.students.length; i++) {
        const student = classX1.students[i];
        // Score between 78 and 98 based on baseScore and index
        const delta = ((i * 3 + 7) % 15) - 6;
        const score = Math.min(100, Math.max(70, a.baseScore + delta));

        await prisma.grade.upsert({
          where: {
            studentId_gradeItemId: {
              studentId: student.id,
              gradeItemId: gradeItem.id,
            },
          },
          update: {
            score,
            isPublished: true,
          },
          create: {
            studentId: student.id,
            gradeItemId: gradeItem.id,
            score,
            notes: score >= 90 ? 'Sangat memuaskan, pertahankan!' : 'Bagus, terus tingkatkan ketelitian.',
            isPublished: true,
            publishedAt: new Date(),
          },
        });
      }
    }
  }

  console.log(`✅ Successfully seeded grade items and scores for ${classX1.students.length} students in X MIPA 1!`);
}

seedGrades()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
