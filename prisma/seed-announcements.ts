import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnnouncements() {
  console.log('Seeding school announcements...');

  const announcementsData = [
    {
      title: 'Surat Edaran: Jadwal dan Tata Tertib Penilaian Akhir Semester (PAS) Ganjil T.A. 2026/2027',
      content: `Diberitahukan kepada seluruh peserta didik, orang tua/wali murid, dan dewan guru SMA Negeri 1 Nusantara bahwa kegiatan Penilaian Akhir Semester (PAS) Ganjil Tahun Ajaran 2026/2027 akan diselenggarakan mulai tanggal 25 November hingga 05 Desember 2026.

Berikut ketentuan yang wajib dipatuhi:
1. Peserta didik wajib hadir 15 menit sebelum bel masuk pukul 07.15 WIB dengan seragam lengkap dan rapi sesuai hari yang ditentukan.
2. Membawa Kartu Peserta Ujian resmi yang telah dicap oleh wali kelas masing-masing.
3. Seluruh gawai/ponsel dan alat komunikasi dimasukkan ke dalam tas di depan ruang kelas selama ujian berlangsung.
4. Kriteria ketuntasan minimal (KKM) sekolah adalah 75.0. Siswa yang belum mencapai batas tuntas diwajibkan mengikuti program remedial terjadwal.

Lampiran jadwal lengkap per mata pelajaran dan denah ruang ujian dapat diunduh melalui tombol lampiran di bawah. Terima kasih atas kerja sama Bapak/Ibu dan ketertiban seluruh peserta didik.`,
      targetRole: 'ALL',
      authorName: 'Wakasek Kurikulum (Drs. Ahmad Fauzi, M.Si.)',
      publishDate: new Date('2026-10-25'),
      expiryDate: new Date('2026-12-15'),
      isPublished: true,
      attachmentUrl: '/uploads/surat-edaran-pas-2026.pdf',
    },
    {
      title: 'Undangan Rapat Pleno Dewan Guru: Evaluasi Rapor Tengah Semester & Program Unggulan',
      content: `Yth. Bapak/Ibu Dewan Guru dan Staf Tenaga Kependidikan SMA Negeri 1 Nusantara,

Sehubungan dengan berakhirnya rangkaian Penilaian Tengah Semester (PTS) dan sinkronisasi E-Rapor digital, kami mengundang Bapak/Ibu untuk menghadiri Rapat Pleno Evaluasi yang akan diselenggarakan pada:
• Hari/Tanggal : Kamis, 05 November 2026
• Waktu : Pukul 13.30 WIB s.d. selesai (setelah KBM)
• Tempat : Ruang Multimedia / Aula Ki Hajar Dewantara
• Agenda : 
  1. Evaluasi ketuntasan belajar per mata pelajaran dan kelas
  2. Pembahasan siswa yang memerlukan pendampingan khusus (BK)
  3. Sosialisasi pedoman asesmen P5 (Projek Penguatan Profil Pelajar Pancasila)

Mengingat pentingnya agenda ini, kehadiran seluruh dewan guru pengampu dan wali kelas bersifat wajib. Terima kasih.`,
      targetRole: 'GURU',
      authorName: 'Kepala Sekolah (Dr. H. Ahmad Sudirman, M.Pd.)',
      publishDate: new Date('2026-10-28'),
      expiryDate: new Date('2026-11-06'),
      isPublished: true,
      attachmentUrl: null,
    },
    {
      title: 'Pendaftaran Seleksi Calon Kontingen Olimpiade Sains Nasional (OSN) Tingkat Sekolah',
      content: `Halo Civitas Siswa Berprestasi SMA Negeri 1 Nusantara!

Bagi kamu yang memiliki minat dan bakat mendalam pada bidang sains dan teknologi, pendaftaran seleksi internal kontingen OSN Tahun 2027 telah resmi dibuka.

Bidang kompetisi yang dibuka:
1. Matematika (Pembimbing: Drs. Ahmad Fauzi, M.Si.)
2. Informatika / Komputer (Pembimbing: Hendra Kusuma, S.Pd., M.Kom.)
3. Biologi (Pembimbing: Rini Puspitasari, S.Pd.)
4. Fisika (Pembimbing: Dra. Hj. Farida, M.Pd.)
5. Kimia & Kebumian

Persyaratan:
• Peserta didik kelas X atau XI aktif.
• Nilai rapor mata pelajaran terkait minimal 85.0.
• Berkomitmen mengikuti program pembinaan intensif sepulang sekolah.

Pendaftaran ditutup pada tanggal 10 November 2026 melalui formulir seleksi di ruang Lab Komputer 1. Buktikan prestasimu dan harumkan nama almamater tercinta!`,
      targetRole: 'SISWA',
      authorName: 'Pembina Prestasi Sains (Hendra Kusuma, M.Kom.)',
      publishDate: new Date('2026-10-30'),
      expiryDate: new Date('2026-11-12'),
      isPublished: true,
      attachmentUrl: null,
    },
    {
      title: 'Bulan Bahasa & Gebyar Literasi Perpustakaan Sekolah 2026',
      content: `Dalam rangka memperingati Hari Sumpah Pemuda dan Bulan Bahasa, Perpustakaan Digital SMA Negeri 1 Nusantara menyelenggarakan rangkaian lomba literasi dan bedah buku novel klasik:

Rangkaian Kegiatan:
• Lomba Resensi Buku & Ulasan Novel Sastra Indonesia
• Kompetisi Cipta & Baca Puisi Tingkat Kelas
• Donasi Buku Layak Baca untuk Pojok Baca Ruang Kelas
• Penghargaan Duta Baca Siswa Teraktif Semester Ganjil

Seluruh pemenang akan mendapatkan piala bergilir, piagam sertifikat resmi, dan voucher belanja buku gramedia. Info teknis selengkapnya dapat ditanyakan kepada petugas di meja sirkulasi perpustakaan. Mari jadikan membaca sebagai gaya hidup generasi muda Indonesia!`,
      targetRole: 'ALL',
      authorName: 'Kepala Perpustakaan (Dra. Sri Wahyuni, M.Pd.)',
      publishDate: new Date('2026-10-27'),
      expiryDate: new Date('2026-11-20'),
      isPublished: true,
      attachmentUrl: null,
    },
  ];

  for (const a of announcementsData) {
    const existing = await prisma.announcement.findFirst({
      where: { title: a.title },
    });

    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: a.title,
          content: a.content,
          targetRole: a.targetRole,
          authorName: a.authorName,
          publishDate: a.publishDate,
          expiryDate: a.expiryDate,
          isPublished: a.isPublished,
          attachmentUrl: a.attachmentUrl,
        },
      });
      console.log(`Created announcement: ${a.title}`);
    }
  }

  console.log('✅ Announcements seeded successfully!');
}

seedAnnouncements()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
