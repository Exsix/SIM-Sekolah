import { prisma } from '../src/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

async function seedTeacherAttendance() {
  console.log('Seeding Teacher Attendance...');

  const teachers = await prisma.teacher.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nip: true },
  });

  console.log(`Found ${teachers.length} teachers.`);

  // Dates: today and past 4 days
  const dates: Date[] = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dates.push(new Date(`${dateStr}T00:00:00.000Z`));
  }

  // Pre-defined patterns for realistic distribution
  const attendancePatterns = [
    {
      status: AttendanceStatus.HADIR,
      inHour: 6,
      inMin: 45,
      outHour: 15,
      outMin: 35,
      notes: 'Hadir tepat waktu',
    },
    {
      status: AttendanceStatus.HADIR,
      inHour: 7,
      inMin: 5,
      outHour: 15,
      outMin: 30,
      notes: 'Hadir tepat waktu',
    },
    {
      status: AttendanceStatus.HADIR,
      inHour: 7,
      inMin: 22, // late (cutoff is 07:15)
      outHour: 15,
      outMin: 40,
      notes: 'Terlambat 7 menit karena kemacetan jalan tol',
    },
    {
      status: AttendanceStatus.DISPENSASI,
      inHour: 8,
      inMin: 0,
      outHour: 16,
      outMin: 0,
      notes: 'Dinas Luar: Workshop Kurikulum Merdeka di Balai Guru Penggerak',
    },
    {
      status: AttendanceStatus.IZIN,
      inHour: null,
      inMin: null,
      outHour: null,
      outMin: null,
      notes: 'Izin: Mengurus berkas sertifikasi pendidik',
    },
    {
      status: AttendanceStatus.SAKIT,
      inHour: null,
      inMin: null,
      outHour: null,
      outMin: null,
      notes: 'Sakit: Surat dokter terlampir di TU',
    },
  ];

  let count = 0;

  for (const date of dates) {
    for (let tIdx = 0; tIdx < teachers.length; tIdx++) {
      const teacher = teachers[tIdx];
      // Pick a pattern based on teacher index and date
      const patternIdx = (tIdx + date.getDate()) % attendancePatterns.length;
      const pattern = attendancePatterns[patternIdx];

      let checkIn: Date | null = null;
      let checkOut: Date | null = null;

      if (pattern.inHour !== null && pattern.inMin !== null) {
        checkIn = new Date(date);
        checkIn.setHours(pattern.inHour, pattern.inMin, 0, 0);
      }

      if (pattern.outHour !== null && pattern.outMin !== null) {
        checkOut = new Date(date);
        checkOut.setHours(pattern.outHour, pattern.outMin, 0, 0);
      }

      await prisma.teacherAttendance.upsert({
        where: {
          teacherId_date: {
            teacherId: teacher.id,
            date,
          },
        },
        update: {
          status: pattern.status,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          notes: pattern.notes,
          recordedBy: 'Sistem SIM',
        },
        create: {
          teacherId: teacher.id,
          date,
          status: pattern.status,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          notes: pattern.notes,
          recordedBy: 'Sistem SIM',
        },
      });

      count++;
    }
  }

  console.log(`Successfully seeded ${count} teacher attendance records!`);
}

seedTeacherAttendance()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
