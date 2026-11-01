import { PrismaClient, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubjects() {
  console.log('Seeding subjects and assignments...');

  // 1. Get active academic year
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  // 2. Get existing teachers by name or position to associate
  const teachers = await prisma.teacher.findMany();
  const getTeacher = (nameSnippet: string) =>
    teachers.find((t) => t.name.toLowerCase().includes(nameSnippet.toLowerCase()));

  const fauzi = getTeacher('Fauzi');       // MTK
  const wahyuni = getTeacher('Wahyuni');   // BIN
  const dewi = getTeacher('Dewi') || getTeacher('Lestari'); // BIG
  const budi = getTeacher('Budi');         // INF
  const hendra = getTeacher('Hendra');     // INF
  const nurul = getTeacher('Nurul');       // PAI
  const rizal = getTeacher('Rizal');       // PJK
  const rini = getTeacher('Rini');         // BIO

  // 3. Define subjects list
  const subjectsData = [
    {
      code: 'MTK-10',
      name: 'Matematika Wajib (Fase E)',
      category: 'Muatan Nasional',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [fauzi?.id].filter(Boolean) as string[],
    },
    {
      code: 'BIN-10',
      name: 'Bahasa Indonesia (Fase E)',
      category: 'Muatan Nasional',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [wahyuni?.id].filter(Boolean) as string[],
    },
    {
      code: 'BIG-10',
      name: 'Bahasa Inggris (Fase E)',
      category: 'Muatan Nasional',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [dewi?.id].filter(Boolean) as string[],
    },
    {
      code: 'PAI-10',
      name: 'Pendidikan Agama Islam & Budi Pekerti',
      category: 'Muatan Nasional',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [nurul?.id].filter(Boolean) as string[],
    },
    {
      code: 'INF-10',
      name: 'Informatika & Literasi Digital',
      category: 'Muatan Nasional',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [budi?.id, hendra?.id].filter(Boolean) as string[],
    },
    {
      code: 'BIO-10',
      name: 'Biologi Umum (Fase E)',
      category: 'Peminatan MIPA',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [rini?.id].filter(Boolean) as string[],
    },
    {
      code: 'PJK-10',
      name: 'Pendidikan Jasmani, Olahraga & Kesehatan',
      category: 'Muatan Nasional',
      gradeLevel: 10,
      isActive: true,
      teacherIds: [rizal?.id].filter(Boolean) as string[],
    },
    {
      code: 'KIM-11',
      name: 'Kimia Tingkat Lanjut',
      category: 'Peminatan MIPA',
      gradeLevel: 11,
      isActive: true,
      teacherIds: [rini?.id].filter(Boolean) as string[],
    },
    {
      code: 'FIS-11',
      name: 'Fisika Eksperimental',
      category: 'Peminatan MIPA',
      gradeLevel: 11,
      isActive: true,
      teacherIds: [fauzi?.id].filter(Boolean) as string[],
    },
    {
      code: 'EKO-11',
      name: 'Ekonomi Terapan & Bisnis',
      category: 'Peminatan IPS',
      gradeLevel: 11,
      isActive: true,
      teacherIds: [wahyuni?.id].filter(Boolean) as string[],
    },
    {
      code: 'GEO-11',
      name: 'Geografi & Penginderaan Jauh',
      category: 'Peminatan IPS',
      gradeLevel: 11,
      isActive: true,
      teacherIds: [dewi?.id].filter(Boolean) as string[],
    },
    {
      code: 'SOS-11',
      name: 'Sosiologi & Riset Sosial',
      category: 'Peminatan IPS',
      gradeLevel: 11,
      isActive: true,
      teacherIds: [nurul?.id].filter(Boolean) as string[],
    },
  ];

  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        category: s.category,
        gradeLevel: s.gradeLevel,
        isActive: s.isActive,
      },
      create: {
        code: s.code,
        name: s.name,
        category: s.category,
        gradeLevel: s.gradeLevel,
        isActive: s.isActive,
      },
    });

    console.log(`Upserted Subject: ${subject.name} (${subject.code})`);

    // Assign teachers
    for (const tId of s.teacherIds) {
      await prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId_academicYearId: {
            teacherId: tId,
            subjectId: subject.id,
            academicYearId: activeYear.id,
          },
        },
        update: {},
        create: {
          teacherId: tId,
          subjectId: subject.id,
          academicYearId: activeYear.id,
        },
      });
    }
  }

  // 4. Also add a few sample schedules for class X MIPA 1 if it exists
  const classX1 = await prisma.class.findFirst({
    where: { name: { contains: 'X MIPA 1' } },
  });

  if (classX1) {
    const mtkSubject = await prisma.subject.findUnique({ where: { code: 'MTK-10' } });
    const binSubject = await prisma.subject.findUnique({ where: { code: 'BIN-10' } });
    const infSubject = await prisma.subject.findUnique({ where: { code: 'INF-10' } });

    if (mtkSubject && fauzi) {
      const existingMtk = await prisma.schedule.findFirst({
        where: { classId: classX1.id, subjectId: mtkSubject.id, dayOfWeek: DayOfWeek.SENIN },
      });
      if (!existingMtk) {
        await prisma.schedule.create({
          data: {
            classId: classX1.id,
            subjectId: mtkSubject.id,
            teacherId: fauzi.id,
            academicYearId: activeYear.id,
            dayOfWeek: DayOfWeek.SENIN,
            startTime: '07:30',
            endTime: '09:00',
            room: 'R. 101',
          },
        });
        console.log('Created schedule for MTK-10');
      }
    }

    if (binSubject && wahyuni) {
      const existingBin = await prisma.schedule.findFirst({
        where: { classId: classX1.id, subjectId: binSubject.id, dayOfWeek: DayOfWeek.SELASA },
      });
      if (!existingBin) {
        await prisma.schedule.create({
          data: {
            classId: classX1.id,
            subjectId: binSubject.id,
            teacherId: wahyuni.id,
            academicYearId: activeYear.id,
            dayOfWeek: DayOfWeek.SELASA,
            startTime: '09:15',
            endTime: '10:45',
            room: 'R. 101',
          },
        });
        console.log('Created schedule for BIN-10');
      }
    }

    if (infSubject && (budi || hendra)) {
      const t = budi || hendra;
      if (t) {
        const existingInf = await prisma.schedule.findFirst({
          where: { classId: classX1.id, subjectId: infSubject.id, dayOfWeek: DayOfWeek.RABU },
        });
        if (!existingInf) {
          await prisma.schedule.create({
            data: {
              classId: classX1.id,
              subjectId: infSubject.id,
              teacherId: t.id,
              academicYearId: activeYear.id,
              dayOfWeek: DayOfWeek.RABU,
              startTime: '07:30',
              endTime: '09:00',
              room: 'Lab Komputer 1',
            },
          });
          console.log('Created schedule for INF-10');
        }
      }
    }
  }

  console.log('✅ Seeding subjects completed successfully!');
}

seedSubjects()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
