import { prisma } from '../src/lib/prisma';
import { AchievementCategory, AchievementLevel } from '@prisma/client';

async function seedAchievements() {
  console.log('Seeding student achievements...');

  const students = await prisma.student.findMany({
    select: { id: true, name: true, nis: true },
    orderBy: { nis: 'asc' },
  });

  if (students.length === 0) {
    console.log('No students found.');
    return;
  }

  const sampleAchievements = [
    {
      studentIndex: 0, // Andi Pratama
      title: 'Olimpiade Sains Nasional (OSN) Bidang Informatika',
      category: AchievementCategory.SAINS_TEKNOLOGI,
      level: AchievementLevel.NASIONAL,
      rank: 'Medali Emas (Juara 1)',
      date: new Date('2026-08-25T00:00:00.000Z'),
      organizer: 'Pusat Prestasi Nasional (Puspresnas) Kemdikbudristek',
      description: 'Meraih medali emas dalam kompetisi pemrograman kompetitif OSN Informatika tingkat nasional dengan poin sempurna pada babak dynamic programming.',
      proofUrl: 'https://example.com/certificates/osn-informatika-2026.pdf',
      isVerified: true,
      isFeatured: true,
    },
    {
      studentIndex: 0, // Andi Pratama
      title: 'Lomba Cipta Algoritma & Hackathon Pelajar Nusantara',
      category: AchievementCategory.SAINS_TEKNOLOGI,
      level: AchievementLevel.PROVINSI,
      rank: 'Juara 1',
      date: new Date('2026-05-14T00:00:00.000Z'),
      organizer: 'Dinas Komunikasi dan Informatika Provinsi DKI Jakarta',
      description: 'Mengembangkan prototype sistem mitigasi bencana berbasis IoT dan sensor cuaca cerdas.',
      proofUrl: 'https://example.com/certificates/hackathon-dki-2026.pdf',
      isVerified: true,
      isFeatured: true,
    },
    {
      studentIndex: 1, // Siti Rahmawati
      title: 'Festival dan Lomba Seni Siswa Nasional (FLS2N) - Vokal Solo Putri',
      category: AchievementCategory.SENI,
      level: AchievementLevel.NASIONAL,
      rank: 'Juara 2 (Medali Perak)',
      date: new Date('2026-09-10T00:00:00.000Z'),
      organizer: 'Balai Pengembangan Talenta Indonesia Kemdikbudristek',
      description: 'Menyanyikan lagu daerah gubahan modern dan lagu wajib nasional dengan teknik vokal harmoni impresif.',
      proofUrl: 'https://example.com/certificates/fls2n-vokal-2026.pdf',
      isVerified: true,
      isFeatured: true,
    },
    {
      studentIndex: 2, // Budi Santoso Jr.
      title: 'Kejuaraan Karate Pelajar Terbuka Piala Gubernur',
      category: AchievementCategory.OLAHRAGA,
      level: AchievementLevel.PROVINSI,
      rank: 'Juara 1 (Kumite -60kg)',
      date: new Date('2026-07-20T00:00:00.000Z'),
      organizer: 'FORKI Provinsi DKI Jakarta',
      description: 'Meraih gelar juara umum kategori kumite kadet putra setelah menang mutlak di babak final.',
      proofUrl: 'https://example.com/certificates/karate-gubernur-2026.pdf',
      isVerified: true,
      isFeatured: false,
    },
    {
      studentIndex: 3, // Dewi Lestari
      title: 'National English Debate Championship (NEDC) High School Division',
      category: AchievementCategory.AKADEMIK,
      level: AchievementLevel.NASIONAL,
      rank: 'Juara 3 & Overall Best Speaker',
      date: new Date('2026-06-18T00:00:00.000Z'),
      organizer: 'Asosiasi Debat Bahasa Inggris Indonesia & Universitas Indonesia',
      description: 'Mewakili kontingen sekolah pada motion geopolitik dan transisi energi terbarukan.',
      proofUrl: 'https://example.com/certificates/nedc-debate-2026.pdf',
      isVerified: true,
      isFeatured: true,
    },
    {
      studentIndex: 4, // Eko Prasetyo
      title: 'Musabaqah Tilawatil Quran (MTQ) Pelajar Tingkat Kota',
      category: AchievementCategory.KEAGAMAAN,
      level: AchievementLevel.KABUPATEN_KOTA,
      rank: 'Juara 1',
      date: new Date('2026-04-12T00:00:00.000Z'),
      organizer: 'Lembaga Pengembangan Tilawatil Quran (LPTQ) Kota Jakarta Pusat',
      description: 'Cabang Tartil Al-Quran dengan pelafalan makhraj dan tajwid terbaik.',
      proofUrl: 'https://example.com/certificates/mtq-kota-2026.pdf',
      isVerified: true,
      isFeatured: false,
    },
    {
      studentIndex: 5, // Fani Wijaya
      title: 'Turnamen Bola Basket Antar Pelajar DBL Series Jakarta',
      category: AchievementCategory.OLAHRAGA,
      level: AchievementLevel.PROVINSI,
      rank: 'Runner-up (Juara 2)',
      date: new Date('2026-09-28T00:00:00.000Z'),
      organizer: 'Development Basketball League (DBL) Indonesia',
      description: 'Kapten tim basket putri SMAN 1 Nusantara yang berhasil menembus partai puncak Fantastic Four.',
      proofUrl: 'https://example.com/certificates/dbl-jakarta-2026.pdf',
      isVerified: true,
      isFeatured: false,
    },
    {
      studentIndex: 6, // Gita Permata
      title: 'Lomba Menulis Esai Ilmiah Populer Tingkat Pelajar se-Jawa Bali',
      category: AchievementCategory.AKADEMIK,
      level: AchievementLevel.PROVINSI,
      rank: 'Juara 1',
      date: new Date('2026-05-30T00:00:00.000Z'),
      organizer: 'Badan Riset dan Inovasi Nasional (BRIN)',
      description: 'Esai berjudul "Strategi Reduksi Emisi Karbon di Lingkungan Sekolah Berbasis Bank Sampah Digital".',
      proofUrl: 'https://example.com/certificates/esai-brin-2026.pdf',
      isVerified: true,
      isFeatured: false,
    },
    {
      studentIndex: 7, // Hendra Gunawan
      title: 'International Mathematics Olympiad Selection Camp (Pelatnas IMO)',
      category: AchievementCategory.AKADEMIK,
      level: AchievementLevel.INTERNASIONAL,
      rank: 'Honorable Mention & Finalis',
      date: new Date('2026-10-05T00:00:00.000Z'),
      organizer: 'International Mathematical Olympiad Committee',
      description: 'Lolos seleksi tahap 2 perwakilan Indonesia pada kompetisi matematika internasional.',
      proofUrl: 'https://example.com/certificates/imo-pelatnas-2026.pdf',
      isVerified: true,
      isFeatured: true,
    },
    {
      studentIndex: 1, // Siti Rahmawati
      title: 'Lomba Poster Digital Kampanye Ramah Lingkungan',
      category: AchievementCategory.SENI,
      level: AchievementLevel.KECAMATAN,
      rank: 'Juara 1',
      date: new Date('2026-10-15T00:00:00.000Z'),
      organizer: 'Kecamatan Gambir',
      description: 'Desain poster edukasi pengurangan sampah plastik sekali pakai di sekolah.',
      proofUrl: 'https://example.com/certificates/poster-kecamatan-2026.pdf',
      isVerified: false, // Pending verification
      isFeatured: false,
    },
  ];

  let insertedCount = 0;
  for (const item of sampleAchievements) {
    const student = students[item.studentIndex] || students[0];
    const existing = await prisma.achievement.findFirst({
      where: {
        studentId: student.id,
        title: item.title,
      },
    });

    if (!existing) {
      await prisma.achievement.create({
        data: {
          studentId: student.id,
          title: item.title,
          category: item.category,
          level: item.level,
          rank: item.rank,
          date: item.date,
          organizer: item.organizer,
          description: item.description,
          proofUrl: item.proofUrl,
          isVerified: item.isVerified,
          isFeatured: item.isFeatured,
        },
      });
      insertedCount++;
    }
  }

  console.log(`Successfully seeded ${insertedCount} student achievements.`);
}

seedAchievements()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
