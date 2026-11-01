import { prisma } from '../src/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

async function seedStudentAttendances() {
  console.log('Seeding student attendances...');

  const students = await prisma.student.findMany({
    select: { id: true, name: true, classId: true },
  });

  const now = new Date();
  const dates: Date[] = [];
  for (let i = 1; i <= 15; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(new Date(`${dateStr}T00:00:00.000Z`));
    }
  }

  let count = 0;
  for (const student of students) {
    for (let idx = 0; idx < dates.length; idx++) {
      const date = dates[idx];
      // 90% Hadir, occasional Izin/Sakit
      let status: AttendanceStatus = AttendanceStatus.HADIR;
      let notes = 'Hadir mengikuti KBM';

      if (idx === 5) {
        status = AttendanceStatus.SAKIT;
        notes = 'Sakit demam';
      } else if (idx === 10) {
        status = AttendanceStatus.IZIN;
        notes = 'Izin keperluan keluarga';
      }

      if (!student.classId) continue;

      const existing = await prisma.studentAttendance.findFirst({
        where: {
          studentId: student.id,
          date,
        },
      });

      if (existing) {
        await prisma.studentAttendance.update({
          where: { id: existing.id },
          data: { status, notes },
        });
      } else {
        await prisma.studentAttendance.create({
          data: {
            studentId: student.id,
            classId: student.classId,
            date,
            status,
            notes,
          },
        });
      }
      count++;
    }
  }

  console.log(`Seeded ${count} student attendance records!`);
}

seedStudentAttendances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
