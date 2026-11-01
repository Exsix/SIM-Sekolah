import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTeachers() {
  console.log('Seeding teacher data...');

  const teachers = [
    {
      nip: '196504151990031002',
      nuptk: '4547743645300012',
      name: 'Dra. Sri Wahyuni, M.Pd.',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Solo',
      birthDate: new Date('1965-04-15'),
      position: 'Guru Bahasa Indonesia',
      employmentStatus: 'PNS' as const,
      education: 'S2 (Magister)',
      joinDate: new Date('1990-03-01'),
      phone: '08121234001',
      email: 'sri.wahyuni@sman1nusantara.sch.id',
      isActive: true,
    },
    {
      nip: '197208202002121003',
      nuptk: '5152750651300043',
      name: 'Drs. Ahmad Fauzi, M.Si.',
      gender: 'LAKI_LAKI' as const,
      birthPlace: 'Malang',
      birthDate: new Date('1972-08-20'),
      position: 'Guru Matematika / Wakasek Kurikulum',
      employmentStatus: 'PNS' as const,
      education: 'S2 (Magister)',
      joinDate: new Date('2002-12-01'),
      phone: '08121234002',
      email: 'ahmad.fauzi@sman1nusantara.sch.id',
      isActive: true,
    },
    {
      nip: null,
      nuptk: null,
      name: 'Rini Puspitasari, S.Pd.',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Bandung',
      birthDate: new Date('1990-03-25'),
      position: 'Guru Biologi',
      employmentStatus: 'GURU_HONORER' as const,
      education: 'S1 (Sarjana)',
      joinDate: new Date('2018-07-16'),
      phone: '08121234003',
      email: 'rini.puspita@sman1nusantara.sch.id',
      isActive: true,
    },
    {
      nip: '198012152006041001',
      nuptk: '2547758659200002',
      name: 'Hendra Kusuma, S.Pd., M.Kom.',
      gender: 'LAKI_LAKI' as const,
      birthPlace: 'Surabaya',
      birthDate: new Date('1980-12-15'),
      position: 'Guru Informatika / Kepala Lab. Komputer',
      employmentStatus: 'PNS' as const,
      education: 'S2 (Magister)',
      joinDate: new Date('2006-04-01'),
      phone: '08121234004',
      email: 'hendra.kusuma@sman1nusantara.sch.id',
      isActive: true,
    },
    {
      nip: null,
      nuptk: '6241766668300025',
      name: 'Nurul Hidayah, S.Pd.I.',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Yogyakarta',
      birthDate: new Date('1988-06-10'),
      position: 'Guru Pendidikan Agama Islam',
      employmentStatus: 'GURU_TETAP_YAYASAN' as const,
      education: 'S1 (Sarjana)',
      joinDate: new Date('2015-07-16'),
      phone: '08121234005',
      email: 'nurul.hidayah@sman1nusantara.sch.id',
      isActive: true,
    },
    {
      nip: null,
      nuptk: null,
      name: 'Rizal Maulana, S.Pd.',
      gender: 'LAKI_LAKI' as const,
      birthPlace: 'Medan',
      birthDate: new Date('1993-11-02'),
      position: 'Guru PJOK (Pendidikan Jasmani)',
      employmentStatus: 'GURU_HONORER' as const,
      education: 'S1 (Sarjana)',
      joinDate: new Date('2022-07-16'),
      phone: '08121234006',
      email: 'rizal.maulana@sman1nusantara.sch.id',
      isActive: true,
    },
    {
      nip: '197503102005012001',
      nuptk: '3642753655300008',
      name: 'Sari Dewi Rahayu, S.E., M.M.',
      gender: 'PEREMPUAN' as const,
      birthPlace: 'Jakarta',
      birthDate: new Date('1975-03-10'),
      position: 'Guru Ekonomi / Wakasek Kesiswaan',
      employmentStatus: 'PPPK' as const,
      education: 'S2 (Magister)',
      joinDate: new Date('2005-01-01'),
      phone: '08121234007',
      email: 'sari.dewi@sman1nusantara.sch.id',
      isActive: true,
    },
  ];

  let created = 0;
  for (const teacher of teachers) {
    try {
      const exists = teacher.nip
        ? await prisma.teacher.findUnique({ where: { nip: teacher.nip } })
        : null;
      if (!exists) {
        await prisma.teacher.create({ data: teacher });
        console.log(`  ✓ ${teacher.name}`);
        created++;
      } else {
        console.log(`  ~ Sudah ada: ${teacher.name}`);
      }
    } catch (e: unknown) {
      console.error(`  ✗ ${teacher.name}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`\nSelesai! ${created} guru baru ditambahkan.`);
  const total = await prisma.teacher.count();
  console.log(`Total guru di database: ${total}`);
}

seedTeachers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
