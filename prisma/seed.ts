import { PrismaClient, RoleName, Gender, TeacherStatus, StudentStatus, Semester } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for SIM Sekolah...');

  // 1. Seed Roles
  const roles = [
    { name: RoleName.SUPER_ADMIN, description: 'Super Administrator dengan hak akses penuh ke seluruh modul sistem' },
    { name: RoleName.ADMIN, description: 'Admin / Operator Sekolah untuk pengelolaan data akademik dan operasional' },
    { name: RoleName.KEPALA_SEKOLAH, description: 'Kepala Sekolah dengan hak monitoring dashboard, laporan, dan statistik' },
    { name: RoleName.GURU, description: 'Guru pengajar mata pelajaran dan pengisi absensi/nilai siswa' },
    { name: RoleName.WALI_KELAS, description: 'Wali Kelas pembina siswa dan pembuat laporan rapor kelas' },
    { name: RoleName.PETUGAS_PERPUSTAKAAN, description: 'Petugas pengelola sirkulasi buku perpustakaan sekolah' },
    { name: RoleName.SISWA, description: 'Siswa dengan akses jadwal, nilai, absensi, dan riwayat perpus' },
    { name: RoleName.ORANG_TUA, description: 'Orang Tua / Wali Murid pemantau absensi dan nilai anak' },
  ];

  const roleMap: Record<string, string> = {};

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roleMap[r.name] = role.id;
  }
  console.log('✅ Roles seeded successfully');

  // 2. Seed Default School Setting
  await prisma.schoolSetting.upsert({
    where: { id: 'default-school-setting' },
    update: {},
    create: {
      id: 'default-school-setting',
      name: 'SMA Negeri 1 Nusantara',
      npsn: '20260001',
      address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
      phone: '021-5551234',
      email: 'info@sman1nusantara.sch.id',
      website: 'https://sman1nusantara.sch.id',
      principalName: 'Dr. H. Ahmad Sudirman, M.Pd.',
      operationalHours: 'Senin - Jumat, 07:00 - 16:00 WIB',
    },
  });
  console.log('✅ School settings seeded');

  // 3. Seed Default Academic Year (2026/2027 - Ganjil)
  const academicYear = await prisma.academicYear.upsert({
    where: {
      name_semester: {
        name: '2026/2027',
        semester: Semester.GANJIL,
      },
    },
    update: { isActive: true },
    create: {
      name: '2026/2027',
      semester: Semester.GANJIL,
      isActive: true,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-12-20'),
    },
  });
  console.log('✅ Academic year seeded');

  // 4. Seed Super Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { password: hashedPassword, roleId: roleMap[RoleName.SUPER_ADMIN] },
    create: {
      username: 'superadmin',
      email: 'superadmin@sekolah.sch.id',
      password: hashedPassword,
      roleId: roleMap[RoleName.SUPER_ADMIN],
      isActive: true,
    },
  });
  console.log(`✅ Super Admin created (username: superadmin, password: admin123) [ID: ${superAdmin.id}]`);

  // 5. Seed Guru & Akun Guru
  const guruUser = await prisma.user.upsert({
    where: { username: 'guru.budi' },
    update: {},
    create: {
      username: 'guru.budi',
      email: 'budi.santoso@sekolah.sch.id',
      password: hashedPassword,
      roleId: roleMap[RoleName.GURU],
      isActive: true,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { nip: '198501152010011002' },
    update: {},
    create: {
      userId: guruUser.id,
      nip: '198501152010011002',
      name: 'Budi Santoso, S.Pd., M.Kom.',
      gender: Gender.LAKI_LAKI,
      email: 'budi.santoso@sekolah.sch.id',
      phone: '081234567890',
      education: 'S2 Magister Komputer',
      position: 'Guru Informatika',
      employmentStatus: TeacherStatus.PNS,
      isActive: true,
    },
  });
  console.log(`✅ Guru seeded: ${teacher.name}`);

  // 6. Seed Kelas
  const kelas10 = await prisma.class.upsert({
    where: { id: 'class-10-ipa-1' },
    update: {},
    create: {
      id: 'class-10-ipa-1',
      name: 'X MIPA 1',
      gradeLevel: 10,
      major: 'MIPA',
      academicYearId: academicYear.id,
      homeroomTeacherId: teacher.id,
      room: 'R. 101',
      capacity: 36,
      isActive: true,
    },
  });
  console.log(`✅ Kelas seeded: ${kelas10.name}`);

  // 7. Seed Siswa & Akun Siswa
  const siswaUser = await prisma.user.upsert({
    where: { username: 'siswa.andi' },
    update: {},
    create: {
      username: 'siswa.andi',
      email: 'andi.pratama@sekolah.sch.id',
      password: hashedPassword,
      roleId: roleMap[RoleName.SISWA],
      isActive: true,
    },
  });

  const student = await prisma.student.upsert({
    where: { nis: '202610001' },
    update: {},
    create: {
      userId: siswaUser.id,
      nis: '202610001',
      nisn: '0081234567',
      name: 'Andi Pratama',
      gender: Gender.LAKI_LAKI,
      birthPlace: 'Jakarta',
      birthDate: new Date('2010-05-12'),
      classId: kelas10.id,
      entryYear: 2026,
      status: StudentStatus.AKTIF,
      address: 'Jl. Kenanga No. 12, Jakarta',
      phone: '085712345678',
    },
  });
  console.log(`✅ Siswa seeded: ${student.name}`);

  // 8. Seed Mata Pelajaran
  const subjectInformatika = await prisma.subject.upsert({
    where: { code: 'INF-10' },
    update: {},
    create: {
      code: 'INF-10',
      name: 'Informatika',
      category: 'Peminatan MIPA',
      gradeLevel: 10,
      isActive: true,
    },
  });

  await prisma.teacherSubject.upsert({
    where: {
      teacherId_subjectId_academicYearId: {
        teacherId: teacher.id,
        subjectId: subjectInformatika.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher.id,
      subjectId: subjectInformatika.id,
      academicYearId: academicYear.id,
    },
  });
  console.log(`✅ Mata pelajaran seeded: ${subjectInformatika.name}`);

  // 9. Seed Kategori Buku & Buku Perpustakaan
  const bookCategory = await prisma.bookCategory.upsert({
    where: { code: '004' },
    update: {},
    create: {
      code: '004',
      name: 'Ilmu Komputer & Pemrograman',
      description: 'Buku-buku teknik informatika dan logika algoritma',
    },
  });

  await prisma.book.upsert({
    where: { isbn: '978-602-001-234-5' },
    update: {},
    create: {
      isbn: '978-602-001-234-5',
      title: 'Dasar-Dasar Pemrograman Web & Algoritma SMA/SMK',
      author: 'Ir. Hendra Kusuma',
      publisher: 'Informatika Press',
      publishYear: 2025,
      categoryId: bookCategory.id,
      rackLocation: 'Rak A-02',
      totalCopies: 10,
      availableCopies: 10,
      condition: 'Sangat Baik',
    },
  });
  console.log('✅ Buku perpustakaan seeded');

  console.log('✨ All seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
