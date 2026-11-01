import { PrismaClient, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSchedules() {
  console.log('Seeding comprehensive timetable schedules...');

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  if (!activeYear) {
    console.error('Active academic year not found');
    return;
  }

  const classX1 = await prisma.class.findFirst({ where: { name: { contains: 'X MIPA 1' } } });
  const classXI = await prisma.class.findFirst({ where: { name: { contains: 'XI IPS 1' } } });

  const teachers = await prisma.teacher.findMany();
  const getTeacher = (nameSnippet: string) =>
    teachers.find((t) => t.name.toLowerCase().includes(nameSnippet.toLowerCase()));

  const fauzi = getTeacher('Fauzi');
  const wahyuni = getTeacher('Wahyuni');
  const dewi = getTeacher('Dewi') || getTeacher('Lestari');
  const budi = getTeacher('Budi');
  const hendra = getTeacher('Hendra');
  const nurul = getTeacher('Nurul');
  const rizal = getTeacher('Rizal');
  const rini = getTeacher('Rini');

  const subjects = await prisma.subject.findMany();
  const getSubject = (code: string) => subjects.find((s) => s.code === code);

  const mtk10 = getSubject('MTK-10');
  const bin10 = getSubject('BIN-10');
  const big10 = getSubject('BIG-10');
  const inf10 = getSubject('INF-10');
  const bio10 = getSubject('BIO-10');
  const pai10 = getSubject('PAI-10');
  const pjk10 = getSubject('PJK-10');

  const eko11 = getSubject('EKO-11');
  const geo11 = getSubject('GEO-11');
  const sos11 = getSubject('SOS-11');

  // Timetable for X MIPA 1
  if (classX1) {
    const slotsX1 = [
      // SENIN
      { day: DayOfWeek.SENIN, start: '07:30', end: '09:00', sub: mtk10, t: fauzi, room: 'R. 101' },
      { day: DayOfWeek.SENIN, start: '09:15', end: '10:45', sub: pai10, t: nurul, room: 'R. 101' },
      { day: DayOfWeek.SENIN, start: '11:00', end: '12:30', sub: bin10, t: wahyuni, room: 'R. 101' },
      // SELASA
      { day: DayOfWeek.SELASA, start: '07:30', end: '09:00', sub: bio10, t: rini, room: 'Lab Biologi' },
      { day: DayOfWeek.SELASA, start: '09:15', end: '10:45', sub: big10, t: dewi, room: 'R. 101' },
      { day: DayOfWeek.SELASA, start: '11:00', end: '12:30', sub: mtk10, t: fauzi, room: 'R. 101' },
      // RABU
      { day: DayOfWeek.RABU, start: '07:30', end: '09:00', sub: inf10, t: hendra || budi, room: 'Lab Komputer 1' },
      { day: DayOfWeek.RABU, start: '09:15', end: '10:45', sub: inf10, t: hendra || budi, room: 'Lab Komputer 1' },
      { day: DayOfWeek.RABU, start: '11:00', end: '12:30', sub: bin10, t: wahyuni, room: 'R. 101' },
      // KAMIS
      { day: DayOfWeek.KAMIS, start: '07:30', end: '09:00', sub: pjk10, t: rizal, room: 'Lapangan Utama' },
      { day: DayOfWeek.KAMIS, start: '09:15', end: '10:45', sub: bio10, t: rini, room: 'R. 101' },
      { day: DayOfWeek.KAMIS, start: '11:00', end: '12:30', sub: big10, t: dewi, room: 'R. 101' },
      // JUMAT
      { day: DayOfWeek.JUMAT, start: '07:30', end: '09:00', sub: pai10, t: nurul, room: 'Masjid Sekolah' },
      { day: DayOfWeek.JUMAT, start: '09:15', end: '10:45', sub: mtk10, t: fauzi, room: 'R. 101' },
    ];

    for (const slot of slotsX1) {
      if (slot.sub && slot.t) {
        const existing = await prisma.schedule.findFirst({
          where: {
            classId: classX1.id,
            dayOfWeek: slot.day,
            startTime: slot.start,
          },
        });

        if (!existing) {
          await prisma.schedule.create({
            data: {
              academicYearId: activeYear.id,
              classId: classX1.id,
              subjectId: slot.sub.id,
              teacherId: slot.t.id,
              dayOfWeek: slot.day,
              startTime: slot.start,
              endTime: slot.end,
              room: slot.room,
            },
          });
          console.log(`Created X MIPA 1 schedule: ${slot.day} ${slot.start}-${slot.end} ${slot.sub.code}`);
        }
      }
    }
  }

  // Timetable for XI IPS 1
  if (classXI) {
    const slotsXI = [
      // SENIN
      { day: DayOfWeek.SENIN, start: '07:30', end: '09:00', sub: eko11, t: wahyuni, room: 'R. 201' },
      { day: DayOfWeek.SENIN, start: '09:15', end: '10:45', sub: geo11, t: dewi, room: 'R. 201' },
      { day: DayOfWeek.SENIN, start: '11:00', end: '12:30', sub: sos11, t: nurul, room: 'R. 201' },
      // SELASA
      { day: DayOfWeek.SELASA, start: '07:30', end: '09:00', sub: sos11, t: nurul, room: 'R. 201' },
      { day: DayOfWeek.SELASA, start: '09:15', end: '10:45', sub: eko11, t: wahyuni, room: 'R. 201' },
      // RABU
      { day: DayOfWeek.RABU, start: '07:30', end: '09:00', sub: geo11, t: dewi, room: 'R. 201' },
      { day: DayOfWeek.RABU, start: '09:15', end: '10:45', sub: eko11, t: wahyuni, room: 'R. 201' },
      // KAMIS
      { day: DayOfWeek.KAMIS, start: '07:30', end: '09:00', sub: sos11, t: nurul, room: 'R. 201' },
      { day: DayOfWeek.KAMIS, start: '09:15', end: '10:45', sub: pjk10, t: rizal, room: 'Lapangan Utama' },
      // JUMAT
      { day: DayOfWeek.JUMAT, start: '07:30', end: '09:00', sub: geo11, t: dewi, room: 'R. 201' },
    ];

    for (const slot of slotsXI) {
      if (slot.sub && slot.t) {
        const existing = await prisma.schedule.findFirst({
          where: {
            classId: classXI.id,
            dayOfWeek: slot.day,
            startTime: slot.start,
          },
        });

        if (!existing) {
          await prisma.schedule.create({
            data: {
              academicYearId: activeYear.id,
              classId: classXI.id,
              subjectId: slot.sub.id,
              teacherId: slot.t.id,
              dayOfWeek: slot.day,
              startTime: slot.start,
              endTime: slot.end,
              room: slot.room,
            },
          });
          console.log(`Created XI IPS 1 schedule: ${slot.day} ${slot.start}-${slot.end} ${slot.sub.code}`);
        }
      }
    }
  }

  console.log('✅ Timetable seeding finished successfully!');
}

seedSchedules()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
