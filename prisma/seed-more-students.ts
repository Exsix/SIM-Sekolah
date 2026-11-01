import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStudents() {
  const cls = await prisma.class.findFirst();
  if (!cls) {
    console.log('No class found');
    return;
  }

  const sampleStudents = [
    {
      nis: '202610003',
      nisn: '0081234568',
      name: 'Bima Satria Nusantara',
      gender: 'LAKI_LAKI' as const,
      birthPlace: 'Surabaya',
      birthDate: new Date('2008-05-14'),
      religion: 'Islam',
      entryYear: 2026,
      status: 'AKTIF' as const,
      classId: cls.id,
      phone: '081234567803',
      email: 'bima.satria@siswa.sch.id',
    },
    {
      nis: '202610004',
      nisn: '0081234569',
      name: 'Dewi Lestari',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Bandung',
      birthDate: new Date('2008-08-22'),
      religion: 'Islam',
      entryYear: 2026,
      status: 'AKTIF' as const,
      classId: cls.id,
      phone: '081234567804',
      email: 'dewi.lestari@siswa.sch.id',
    },
    {
      nis: '202610005',
      nisn: '0081234570',
      name: 'Fajar Nugraha',
      gender: 'LAKI_LAKI' as const,
      birthPlace: 'Semarang',
      birthDate: new Date('2008-01-30'),
      religion: 'Islam',
      entryYear: 2026,
      status: 'AKTIF' as const,
      classId: cls.id,
      phone: '081234567805',
      email: 'fajar.nugraha@siswa.sch.id',
    },
    {
      nis: '202610006',
      nisn: '0081234571',
      name: 'Grace Natalia',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Medan',
      birthDate: new Date('2008-12-15'),
      religion: 'Kristen Protestan',
      entryYear: 2026,
      status: 'AKTIF' as const,
      classId: cls.id,
      phone: '081234567806',
      email: 'grace.natalia@siswa.sch.id',
    },
    {
      nis: '202610007',
      nisn: '0081234572',
      name: 'Irfan Maulana',
      gender: 'LAKI_LAKI' as const,
      birthPlace: 'Yogyakarta',
      birthDate: new Date('2008-03-10'),
      religion: 'Islam',
      entryYear: 2026,
      status: 'AKTIF' as const,
      classId: cls.id,
      phone: '081234567807',
      email: 'irfan.maulana@siswa.sch.id',
    },
    {
      nis: '202610008',
      nisn: '0081234573',
      name: 'Jessica Tanuwijaya',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Jakarta',
      birthDate: new Date('2008-07-07'),
      religion: 'Katolik',
      entryYear: 2026,
      status: 'AKTIF' as const,
      classId: cls.id,
      phone: '081234567808',
      email: 'jessica.tan@siswa.sch.id',
    },
  ];

  for (const s of sampleStudents) {
    const exists = await prisma.student.findUnique({ where: { nis: s.nis } });
    if (!exists) {
      await prisma.student.create({ data: s });
      console.log(`Created student: ${s.name}`);
    }
  }

  const total = await prisma.student.count();
  console.log(`Total students now: ${total}`);
}

seedStudents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
