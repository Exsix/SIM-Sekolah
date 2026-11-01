import { prisma } from '../src/lib/prisma';

async function seedNotifications() {
  console.log('Seeding demo notifications...');

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: { select: { name: true } } },
  });

  const superAdmin = users.find((u) => u.username === 'superadmin');
  const guru = users.find((u) => u.username === 'guru.budi');
  const siswa = users.find((u) => u.username === 'siswa.andi');

  const notificationsToCreate = [];

  if (superAdmin) {
    notificationsToCreate.push(
      {
        userId: superAdmin.id,
        title: 'Pengajuan Prestasi Baru Siswa',
        message: 'Siswa Siti Rahmawati mengajukan portofolio Lomba Poster Digital untuk diverifikasi kesiswaan.',
        type: 'ACHIEVEMENT',
        link: '/dashboard/achievements?tab=unverified',
        isRead: false,
      },
      {
        userId: superAdmin.id,
        title: 'Rekap Presensi Bulanan Guru Siap Diunduh',
        message: 'Laporan kehadiran guru & GTK bulan Oktober telah dikompilasi secara otomatis ke format Excel.',
        type: 'ATTENDANCE',
        link: '/dashboard/teacher-attendance',
        isRead: false,
      },
      {
        userId: superAdmin.id,
        title: 'Log Keamanan Sistem Terdeteksi',
        message: 'Aktivitas masuk sesi (login) berhasil dicatat dari alamat IP lokal untuk akun Administrator.',
        type: 'SECURITY',
        link: '/dashboard/audit-logs',
        isRead: true,
      }
    );
  }

  if (guru) {
    notificationsToCreate.push(
      {
        userId: guru.id,
        title: 'Jadwal Mengajar Hari Ini',
        message: 'Anda memiliki jadwal mengajar Pemrograman Dasar di kelas X IPA 1 pukul 07:30 - 09:00 WIB.',
        type: 'SCHEDULE',
        link: '/dashboard/schedules',
        isRead: false,
      },
      {
        userId: guru.id,
        title: 'Presensi Siswa Belum Diisi',
        message: 'Mohon lakukan verifikasi absensi kelas X IPA 1 untuk sesi jam pertama.',
        type: 'ATTENDANCE',
        link: '/dashboard/attendance',
        isRead: false,
      },
      {
        userId: guru.id,
        title: 'Warta Pengumuman Rapat Dewan Guru',
        message: 'Undangan Rapat Evaluasi Kurikulum Merdeka Semester Ganjil hari Jumat pukul 13:00 WIB di Ruang Multimedia.',
        type: 'ANNOUNCEMENT',
        link: '/dashboard/announcements',
        isRead: true,
      }
    );
  }

  if (siswa) {
    notificationsToCreate.push(
      {
        userId: siswa.id,
        title: 'Prestasi Anda Telah Diverifikasi! 🎉',
        message: 'Prestasi "Olimpiade Sains Nasional Bidang Informatika" telah divalidasi oleh Kesiswaan dan tampil di Hall of Fame.',
        type: 'ACHIEVEMENT',
        link: '/dashboard/achievements',
        isRead: false,
      },
      {
        userId: siswa.id,
        title: 'Nilai Asesmen Baru Diterbitkan',
        message: 'Nilai PTS / UTS Fisika Dasar telah diinput oleh Bapak Budi Santoso, S.Pd., M.Kom. (Nilai: 92.0)',
        type: 'GRADE',
        link: '/dashboard/grades',
        isRead: false,
      },
      {
        userId: siswa.id,
        title: 'Pengingat Pengembalian Buku Perpustakaan',
        message: 'Buku "Algoritma dan Struktur Data Modern" yang Anda pinjam akan jatuh tempo dalam 2 hari ke depan.',
        type: 'LIBRARY',
        link: '/dashboard/library',
        isRead: false,
      },
      {
        userId: siswa.id,
        title: 'Pengumuman Libur Nasional & KBM',
        message: 'Pemberitahuan penyesuaian jadwal pembelajaran tatap muka dan gladi bersih Asesmen Nasional.',
        type: 'ANNOUNCEMENT',
        link: '/dashboard/announcements',
        isRead: true,
      }
    );
  }

  let count = 0;
  for (const n of notificationsToCreate) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: n.userId,
        title: n.title,
      },
    });

    if (!existing) {
      await prisma.notification.create({ data: n });
      count++;
    }
  }

  console.log(`Successfully seeded ${count} demo notifications.`);
}

seedNotifications()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
